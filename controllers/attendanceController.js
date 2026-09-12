const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const PDFDocument = require('pdfkit');

// একটি স্টুডেন্টের মাসিক উপস্থিতি save/update
exports.saveMonthly = async (req, res) => {
  try {
    const { studentId, year, month, days } = req.body;
    if (!studentId || !year || !month || !Array.isArray(days))
      return res.status(400).json({ success: false, message: 'Missing fields' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    if (req.admin.role === 'branch' && String(student.branch) !== String(req.admin.branch))
      return res.status(403).json({ success: false, message: 'Not allowed' });

    const doc = await Attendance.findOneAndUpdate(
      { student: studentId, year, month },
      {
        branch: student.branch, class: student.class, student: studentId,
        year, month, days, markedBy: req.admin._id
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, data: doc });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// একসাথে পুরো ক্লাসের আপডেট
exports.saveBulk = async (req, res) => {
  try {
    const { year, month, records } = req.body; // records: [{studentId, days: [...]}]
    if (!year || !month || !Array.isArray(records))
      return res.status(400).json({ success: false, message: 'Missing fields' });

    const out = [];
    for (const r of records) {
      const student = await Student.findById(r.studentId);
      if (!student) continue;
      if (req.admin.role === 'branch' && String(student.branch) !== String(req.admin.branch)) continue;
      const doc = await Attendance.findOneAndUpdate(
        { student: r.studentId, year, month },
        {
          branch: student.branch, class: student.class, student: r.studentId,
          year, month, days: r.days, markedBy: req.admin._id
        },
        { new: true, upsert: true }
      );
      out.push(doc);
    }
    res.json({ success: true, count: out.length, data: out });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Admin: একটি ক্লাসের সব শিক্ষার্থীর attendance একসাথে
exports.classMonthly = async (req, res) => {
  try {
    const { classId, year, month } = req.query;
    const students = await Student.find({ class: classId, isActive: true }).sort('roll');
    const atts = await Attendance.find({ class: classId, year, month });
    const map = {};
    atts.forEach(a => { map[String(a.student)] = a; });
    const data = students.map(s => ({ student: s, attendance: map[String(s._id)] || null }));
    res.json({ success: true, data });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// Student: নিজের মাসিক attendance
exports.myMonthly = async (req, res) => {
  try {
    const { year, month } = req.query;
    const att = await Attendance.findOne({ student: req.student._id, year, month });
    if (!att) return res.status(404).json({ success: false, message: 'No attendance found' });
    res.json({ success: true, data: att });
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};

// PDF generate — admin অথবা student দুইজনই ব্যবহার করতে পারবে
exports.attendancePdf = async (req, res) => {
  try {
    const { studentId, year, month } = req.query;
    let student;
    if (req.admin) {
      student = await Student.findById(studentId).populate('class branch');
    } else {
      student = await Student.findById(req.student._id).populate('class branch');
    }
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    const att = await Attendance.findOne({ student: student._id, year: Number(year), month: Number(month) });
    if (!att) return res.status(404).json({ success: false, message: 'No attendance found' });

    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="attendance-${student.roll}-${year}-${month}.pdf"`);
    doc.pipe(res);

    doc.fontSize(18).text('Attendance Report', { align: 'center' });
    doc.moveDown(0.6);
    doc.fontSize(11);
    doc.text(`Student: ${student.name}`);
    doc.text(`Roll: ${student.roll}`);
    doc.text(`Class: ${student.class.name} (${student.class.section})`);
    doc.text(`Branch: ${student.branch.name}`);
    doc.text(`Month: ${monthNames[month - 1]} ${year}`);
    doc.moveDown(0.8);

    const days = att.days || [];
    let present = 0, absent = 0, leave = 0, unmarked = 0;

    let y = doc.y;
    doc.fontSize(11).text('Date', 40, y).text('Status', 160, y);
    y += 18;
    doc.moveTo(40, y - 4).lineTo(400, y - 4).stroke();
    y += 6;

    days.forEach((s, i) => {
      let label = 'Not Marked';
      if (s === 'P') { present++; label = 'Present'; }
      else if (s === 'A') { absent++; label = 'Absent'; }
      else if (s === 'L') { leave++; label = 'Leave'; }
      else unmarked++;

      doc.fontSize(10).text(String(i + 1), 40, y).text(label, 160, y);
      y += 15;
      if (y > 750) { doc.addPage(); y = 40; }
    });

    doc.moveDown(1.5);
    doc.fontSize(12).text('Summary:', 40, y + 10);
    doc.fontSize(11).text(`Present     : ${present}`, 40, y + 30);
    doc.text(`Absent      : ${absent}`, 40, y + 46);
    doc.text(`Leave       : ${leave}`, 40, y + 62);
    doc.text(`Not Marked  : ${unmarked}`, 40, y + 78);

    doc.end();
  } catch (e) { res.status(500).json({ success: false, message: e.message }); }
};