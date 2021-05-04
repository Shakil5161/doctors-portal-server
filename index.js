const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors')
const fs = require('fs-extra')

const fileUpload = require('express-fileupload')

const app = express()

app.use(bodyParser.json());
app.use(cors())
app.use(express.static('doctors'));
app.use(fileUpload())

const port = 5505

const MongoClient = require('mongodb').MongoClient;
const uri = process.env.DB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const appointmentCollection = client.db("doctorsPortal").collection("appointment");
  const doctorCollection = client.db("doctorsPortal").collection("doctors");
  const adminCollection = client.db("doctorsPortal").collection("admins");
  app.post("/addAppointment", (req, res) => {
    appointmentCollection.insertOne(req.body)
      .then(result => {
        console.log(result)
        res.json(result.insertedCount > 0)
      })
  })

  app.get('/allPatients', (req, res) => {
    appointmentCollection.find({})
      .toArray((err, result) => {
        res.json(result)
      })
  })

  app.post("/appointmentsByDate", (req, res) => {
    const date = req.body
    const email = req.body.email;
    console.log('email', email)

    doctorCollection.find({ email: email })
      .toArray((err, doctor) => {
        const filter = { date: date.date };
        if (doctor.length === 0) {
          filter.name = email;
        }

        appointmentCollection.find(filter)
          .toArray((err, document) => {
            console.log(document)
            res.json(document)
          })
      })

  })

  app.post('/isDoctor', (req, res) => {
    const email = req.body.email;
    doctorCollection.find({ email: email })
      .toArray((err, doctor) => {
        console.log('length', doctor.length)
        res.json(doctor.length > 0)
      })
  })

  app.post('/isAdmin', (req, res) => {
    adminCollection.find({ email: req.body.email })
      .toArray((err, admin) => {
        res.send(admin.length > 0)
      })
  })

  app.post('/addDoctor', (req, res) => {
    const file = req.files.file;
    const name = req.body.name;
    const email = req.body.email;

    const filePath = `${__dirname}/doctors/${file.name}`;
    console.log(name, email, file)
    // file.mv(filePath, err => {
    //   if (err) {
    //     console.log(err);
    //     res.status(500).send(err);
    //   }

    const newImg = req.files.file.data
    const encImg = newImg.toString('base64')

    var image = {
      contentType: file.mimetype,
      size: file.size,
      img: Buffer.from(encImg, 'base64')
    }

    doctorCollection.insertOne({ name, email, image })
      .then(result => {
        // fs.remove(filePath, errors => {
        //   if (errors) {
        //     console.log(errors)
        //     res.status(500).send(err);
        //   }
        res.send(result.insertedCount > 0)
        // })

      })
    // return res.send({ name: file.name, path: `/${file.name}` })
    // })
  })

  app.get('/ourDoctors', (req, res) => {
    doctorCollection.find({})
      .toArray((err, result) => {
        res.send(result);
      })
  })

});

app.get('/', (req, res) => {
  res.send('Hello doctor portal server!')
  console.log('db connection established')
})

app.listen(process.env.PORT || port)