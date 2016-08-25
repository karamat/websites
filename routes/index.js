var express       =  require('express');
var request       =  require('request');
var cheerio       =  require('cheerio');
var router        =  express.Router();
var async         =  require('async');
var RSVP          =  require('rsvp');
var normalizeUrl  = require('normalize-url');
var validateUrl   = require('url-validator');


// Using simple callbacks

router.get('/I/want/title', function(req, res, next) {
  var urls = req.query.address;
  var websites = [];

  if (toString.call(urls) != "[object Array]") {
    urls = [urls];
  }

  var getTitle = function (urls, websites) {
    var url = urls.shift();
    var normalizedUrl = normalizeUrl(url)
    if (validateUrl(normalizedUrl)) {
      request(normalizedUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(body)
          websites.push({url: url, title: $('title').html()});
          if( urls.length != 0) {
            getTitle(urls, websites);    
          } else {
            res.render('index',{websites: websites})
          }
        }
      })  
    } else {
      websites.push({url: url, title: 'NO RESPONSE'});
      if( urls.length != 0) {
        getTitle(urls, websites);    
      } else {
        res.render('index',{websites: websites})
      }
    }
  }

  getTitle(urls, websites);

});


// Using async

router.get('/V/want/title', function(req, res, next) {
  var urls = req.query.address;

  if (toString.call(urls) != "[object Array]") {
    urls = [urls];
  }

  async.map(urls, function(url,cb) {
    var normalizedUrl = normalizeUrl(url)
    if (validateUrl(normalizedUrl)) {
      request(normalizedUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var $ = cheerio.load(body)
          cb(null, {url: url, title: $('title').html()});
        }
      })
    } else {
      cb(null, {url: url, title: "NO RESPONSE"})  
    }
  }, 
  function(err, result) {
    res.render('index',{websites: result})
  })

});


// Using Promise Library RSVP

router.get('/U/want/title', function(req, res, next) {
  var urls = req.query.address;

  if (toString.call(urls) != "[object Array]") {
    urls = [urls];
  }
  
  var getTitle = function(url) {
    var normalizedUrl = normalizeUrl(url)

    var promise = new RSVP.Promise(function(resolve, reject) {
      if (validateUrl(normalizedUrl)) {
        request(normalizedUrl, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            var $ = cheerio.load(body)
            resolve({url: url, title: $('title').html()});
          } else {
            reject(error);
          }
        })
      } else {
        resolve({url: url, title: "NO RESPONSE"});
      }
    });
    return promise;
  }

  var promises = urls.map(getTitle);

  RSVP.all(promises).then(function(result) {
    res.render('index',{websites: result})
  }).catch(function(error){
    res.error(error);
  });

});

module.exports = router;
