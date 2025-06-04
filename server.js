// student_result_api/index.js

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://127.0.0.1:27017/student_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

// Student Schema
const StudentSchema = new mongoose.Schema({
  name: String,
  rollNo: String,
  department: String,
  marks: [
    {
      subject: String,
      score: Number,
      grade: String,
    },
  ],
  cgpa: Number,
});

const Student = mongoose.model('Student', StudentSchema);

// Calculate CGPA
const calculateCGPA = (marks) => {
  if (marks.length === 0) return 0;
  let total = 0;
  marks.forEach((m) => {
    total += m.score;
  });
  return (total / marks.length) / 10;
};

// CRUD Routes

// Add Student
app.post('/students', async (req, res) => {
  try {
    const student = new Student(req.body);
    student.cgpa = calculateCGPA(student.marks);
    await student.save();
    res.status(201).send(student);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Get Student by ID
app.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).send('Student not found');
    res.send(student);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Update Student Info
app.put('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!student) return res.status(404).send('Student not found');
    student.cgpa = calculateCGPA(student.marks);
    await student.save();
    res.send(student);
  } catch (err) {
    res.status(400).send(err);
  }
});

// Delete Student
app.delete('/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).send('Student not found');
    res.send('Student deleted');
  } catch (err) {
    res.status(500).send(err);
  }
});

// Get Top 10 Students by CGPA
app.get('/students/topper', async (req, res) => {
  const students = await Student.find().sort({ cgpa: -1 }).limit(10);
  res.send(students);
});

// Get Failed Students (score < 40 in any subject)
app.get('/students/failed', async (req, res) => {
  const students = await Student.find({ 'marks.score': { $lt: 40 } });
  res.send(students);
});

// Filter by Min CGPA
app.get('/students', async (req, res) => {
  const minCgpa = parseFloat(req.query.minCgpa);
  const filter = isNaN(minCgpa) ? {} : { cgpa: { $gte: minCgpa } };
  const students = await Student.find(filter);
  res.send(students);
});

// Start Server
app.listen(3000, () => console.log('Server running on port 3000'));
