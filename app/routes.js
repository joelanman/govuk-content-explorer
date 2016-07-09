var express = require('express');
var router = express.Router();
var request = require('request-promise');
var querystring = require('querystring');

var log = function(data){
  console.log(JSON.stringify(data, null, '  '));
}

router.get('/', function (req, res) {

  res.render('index');

});


// Example routes - feel free to delete these

// Passing data into a page

router.get('/examples/template-data', function (req, res) {

  res.render('examples/template-data', { 'name' : 'Foo' });

});

// Branching

router.get('/examples/over-18', function (req, res) {

  // get the answer from the query string (eg. ?over18=false)
  var over18 = req.query.over18;

  if (over18 == "false"){

    // redirect to the relevant page
    res.redirect("/examples/under-18");

  } else {

    // if over18 is any other value (or is missing) render the page requested
    res.render('examples/over-18');

  }

});

// add your routes here

router.get('/search', function(req, res){

  // todo:
  // get facets: mainstream browse, orgs, topics, format

  var query = req.query;
  var viewData = {};

  var start = (query.start == undefined) ? 0  : Number(query.start);
  var count = (query.count == undefined) ? 30 : Number(query.count);

  var queryObj = {};

  queryObj.start = start;
  queryObj.count = count;

  var query = querystring.stringify(queryObj);

  var govukSearchURL = "https://www.gov.uk/api/search.json?" + query;

  console.log(govukSearchURL);

  request(govukSearchURL)
  .then(function(searchResponse){

    var searchData = JSON.parse(searchResponse);
    viewData.results = searchData.results;

    // log(viewData.results);

    return request("https://www.gov.uk/api/search.json?facet_format=1000&count=0");

  }).then(function(formatsResponse){

    var formatsData = JSON.parse(formatsResponse);

    // log(formatsData);

    viewData.formats = formatsData.facets.format.options.map(function(facet){
      return {
        'name' : facet.value.slug.replace(/_/g, ' '),
        'slug' : facet.value.slug,
        'count': facet.documents
      };
    });

    viewData.formats.sort(function(a,b){
      if (a.name > b.name){
        return 1;
      } else {
        return -1;
      }
    });

    return request("https://www.gov.uk/api/search.json?facet_organisations=1000&count=0");

  }).then(function(organisationsResponse){

    var organisationsData = JSON.parse(organisationsResponse);

    log(organisationsData);

    viewData.organisations = organisationsData.facets.organisations.options.map(function(facet){
      if (facet.value.title){
        return {
          'name' : facet.value.title,
          'slug' : facet.value.slug,
          'count': facet.documents
        };
      }
    });

    viewData.organisations.sort(function(a,b){
      if (a.name > b.name){
        return 1;
      } else {
        return -1;
      }
    });

    viewData.start = start;
    viewData.count = count;
    viewData.nextPage = start + count;
    viewData.prevPage = start - count;
    res.render('search', viewData);

  });

});


module.exports = router;
