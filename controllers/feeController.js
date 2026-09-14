const Fee = require('../models/Fee');
const Student = require('../models/Student');
const Class = require('../models/Class');
const PDFDocument = require('pdfkit');

// এক স্টুডেন্টের ফি তৈরি — ক্লাসের default amount
exports.create = async (req, res) => {
  try {
    const { classId, roll, month, year, amount } = req.body;
    const student = await Student.findOne({ class: classId, roll });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (req.admin.role === 'branch' && String(student.branch) !== String(req.admin.branch))
      return res.status(403).json({ success: false, message: 'Not allowed' });

    const cls = await Class.findById(classId);
    const finalAmount = amount != null ? Number(amount) : (cls?.monthlyFee || 0);

    const fee = await Fee.findOneAndUpdate(
      { student: student._id, month, year },
      {
        branch: student.branch, class: student.class, student: student._id,
        month, year, amount: finalAmount, status: 'pending'
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, data: fee });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// পুরো ক্লাসের জন্য fee তৈরি — ক্লাসের monthlyFee ব্যবহার করবে
exports.bulkCreate = async (req, res) => {
  try {
    const { classId, month, year, amount } = req.body;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    const finalAmount = amount != null ? Number(amount) : (cls.monthlyFee || 0);
    if (finalAmount <= 0)
      return res.status(400).json({ success: false, message: 'Class monthlyFee set করা হয়নি' });

    const students = await Student.find({ class: classId, isActive: true });
    const out = [];
    for (const s of students) {
      const fee = await Fee.findOneAndUpdate(
        { student: s._id, month, year },
        {
          branch: s.branch, class: s.class, student: s._id,
          month, year, amount: finalAmount, status: 'pending'
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      out.push(fee);
    }
    res.status(201).json({ success: true, count: out.length, data: out });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Advance fee batch তৈরি (আগামী N মাসের)
exports.bulkAdvance = async (req, res) => {
  try {
    const { classId, year, startMonth, months = 3, amount } = req.body;
    const cls = await Class.findById(classId);
    if (!cls) return res.status(404).json({ success: false, message: 'Class not found' });
    const finalAmount = amount != null ? Number(amount) : (cls.monthlyFee || 0);

    const students = await Student.find({ class: classId, isActive: true });
    const out = [];
    for (const s of students) {
      for (let i = 0; i < months; i++) {
        let m = startMonth + i;
        let y = year;
        while (m > 12) { m -= 12; y += 1; }
        const fee = await Fee.findOneAndUpdate(
          { student: s._id, month: m, year: y },
          {
            branch: s.branch, class: s.class, student: s._id,
            month: m, year: y, amount: finalAmount,
            isAdvance: true, status: 'pending'
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        out.push(fee);
      }
    }
    res.status(201).json({ success: true, count: out.length, data: out });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

exports.list = async (req, res) => {
  const filter = {};
  if (req.query.class) filter.class = req.query.class;
  if (req.query.month) filter.month = req.query.month;
  if (req.query.year) filter.year = req.query.year;
  if (req.query.status) filter.status = req.query.status;
  if (req.admin.role === 'branch') filter.branch = req.admin.branch;

  const list = await Fee.find(filter)
    .populate('student', 'name roll mobile')
    .populate('class', 'name section monthlyFee')
    .sort('-createdAt');
  res.json({ success: true, data: list });
};

// যাচাই — verified হলে receiptNo auto-create হবে (pre-save hook)
exports.verify = async (req, res) => {
  try {
    const { status, remark } = req.body;
    if (!['verified', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'status must be verified or rejected' });

    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.admin.role === 'branch' && String(fee.branch) !== String(req.admin.branch))
      return res.status(403).json({ success: false, message: 'Not allowed' });

    fee.status = status;
    fee.remark = remark;
    fee.verifiedAt = new Date();
    fee.verifiedBy = req.admin._id;
    await fee.save();
    res.json({ success: true, data: fee });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// 🆕 Professional Receipt PDF
exports.receiptPdf = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('student', 'name roll mobile fatherName address')
      .populate('class', 'name section')
      .populate('branch', 'name address phone');

    if (!fee) return res.status(404).json({ success: false, message: 'Fee not found' });
    if (fee.status !== 'verified')
      return res.status(400).json({ success: false, message: 'Receipt only available for verified payments' });

    // student নিজের receipt চাইলে permission check
    if (req.student && String(fee.student._id) !== String(req.student._id))
      return res.status(403).json({ success: false, message: 'Not your receipt' });

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="receipt-${fee.receiptNo || fee._id}.pdf"`);
    doc.pipe(res);

    // ===== হেডার =====
    doc.rect(0, 0, doc.page.width, 110).fill('#0a0a0a');
    doc.fillColor('#dfae42').fontSize(22).font('Helvetica-Bold')
      .text('দারুল উলূম ইসলামিয়া মাদ্রাসা', 40, 30);
    doc.fillColor('#94a3b8').fontSize(10).font('Helvetica')
      .text(fee.branch?.name || '', 40, 60)
      .text(fee.branch?.address || '', 40, 74)
      .text(fee.branch?.phone ? `Phone: ${fee.branch.phone}` : '', 40, 88);

    doc.fillColor('#dfae42').fontSize(14).font('Helvetica-Bold')
      .text('FEE RECEIPT', 0, 30, { align: 'right', width: doc.page.width - 40 });
    doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
      .text(fee.receiptNo || '—', 0, 52, { align: 'right', width: doc.page.width - 40 });
    doc.fillColor('#94a3b8').fontSize(9).font('Helvetica')
      .text(`Date: ${new Date(fee.verifiedAt).toLocaleDateString('en-GB')}`, 0, 72, { align: 'right', width: doc.page.width - 40 });

    // ===== শিক্ষার্থীর তথ্য =====
    let y = 140;
    doc.fillColor('#0a0a0a').fontSize(11).font('Helvetica-Bold').text('BILLED TO', 40, y);
    y += 18;
    doc.fillColor('#111').fontSize(13).font('Helvetica-Bold').text(fee.student?.name || '', 40, y);
    y += 18;
    doc.fillColor('#334155').fontSize(10).font('Helvetica')
      .text(`Roll: ${fee.student?.roll || ''}`, 40, y)
      .text(`Class: ${fee.class?.name || ''} - ${fee.class?.section || ''}`, 40, y + 14)
      .text(`Mobile: ${fee.student?.mobile || ''}`, 40, y + 28);
    if (fee.student?.address) doc.text(`Address: ${fee.student.address}`, 40, y + 42);

    // ===== পেমেন্ট সারসংক্ষেপ =====
    y += 80;
    doc.fillColor('#0a0a0a').fontSize(11).font('Helvetica-Bold').text('PAYMENT DETAILS', 40, y);
    y += 16;

    // টেবিল
    doc.rect(40, y, 515, 26).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold')
      .text('Description', 50, y + 8)
      .text('Amount', 0, y + 8, { align: 'right', width: 535 });
    y += 26;

    const periodLabel = fee.isAdvance ? 'Advance Fee' : 'Monthly Fee';
    doc.fillColor('#111').font('Helvetica').fontSize(10)
      .text(`${periodLabel} — ${monthNames[fee.month - 1]} ${fee.year}`, 50, y + 10)
      .text(`BDT ${fee.amount.toFixed(2)}`, 0, y + 10, { align: 'right', width: 535 });
    y += 30;

    doc.rect(40, y, 515, 26).fill('#f1f5f9');
    doc.fillColor('#0a0a0a').font('Helvetica-Bold').fontSize(11)
      .text('TOTAL PAID', 50, y + 8)
      .text(`BDT ${fee.amount.toFixed(2)}`, 0, y + 8, { align: 'right', width: 535 });
    y += 50;

    // ===== পেমেন্ট মেথড =====
    doc.fillColor('#0a0a0a').fontSize(11).font('Helvetica-Bold').text('PAYMENT INFO', 40, y);
    y += 16;
    doc.font('Helvetica').fontSize(10).fillColor('#334155');
    doc.text(`Method: ${(fee.method || 'manual').toUpperCase()}`, 40, y); y += 14;
    doc.text(`Transaction ID: ${fee.transactionId || '—'}`, 40, y); y += 14;
    doc.text(`Sender Number: ${fee.senderNumber || '—'}`, 40, y); y += 14;
    doc.text(`Status: ${fee.status.toUpperCase()}`, 40, y); y += 14;
    if (fee.remark) doc.text(`Remark: ${fee.remark}`, 40, y);

    // ===== ফুটার =====
    y = 720;
    doc.moveTo(40, y).lineTo(555, y).strokeColor('#e2e8f0').stroke();
    y += 10;
    doc.fontSize(9).fillColor('#64748b')
      .text('This is a computer-generated receipt. No signature is required.', 40, y);
    doc.fillColor('#94a3b8')
      .text('দারুল উলূম ইসলামিয়া মাদ্রাসা — জাযাকাল্লাহু খাইরান', 0, y, { align: 'right', width: 555 });

    doc.end();
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};