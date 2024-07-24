require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');
const { url } = require('inspector');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error(`Error connecting to MongoDB: ${err}`))

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
})

const Url = mongoose.model('Url', urlSchema);

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});



/**
 * You can POST a URL to /api/url and get a JSON response with original_url
 * and short_url properties. 
 * 
 * Ex: {original_url: https://freecodecamp.org', short_url: 1}
 */
app.post('/api/shorturl', async (req, res) => {
  // Check for valid URL
  console.log('Beginning post');
  console.log(`Req.body.url: ${req.body.url}`)
  try {
    const response = await fetch(req.body.url);
    if(response.ok) {
      console.log("Valid URL");

      Url.findOne()
      .sort({ short_url: -1 })
      .limit(1) // highest value
      .then((result) => {
        const newUrl = new Url({
          original_url : req.body.url,
          short_url : Number(result.short_url + 1)
        });
        newUrl.save();
        res.json(newUrl);
      });

    }
    else {
      res.json({ error: 'invalid url' });
    }
  }
  catch (error) {
    res.json({ error: 'invalid url' });
  }
});

/**
 * When user visits the api endpoint with the short_url param,
 * redirects the user to the original url.
 */
app.get('/api/shorturl/:shorturl', (req, res) => {
  console.log('GET in progress');

  let shortUrl = req.params.shorturl;
  Url.findOne({short_url: shortUrl})
  .then((result) => {
    console.log(`Attempting to redirect to: ${result.original_url}`);
    res.redirect(302, `${result.original_url}`)
  })
  .catch((error) => {
    console.error(error);
  })
}) 



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
