'use strict';

var express = require('express');
var mongo = require('mongodb').MongoClient;
var mongoose = require('mongoose');
var dns = require("dns");
var bodyParser = require("body-parser");

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongo.connect(process.env.MONGO_URI, {
            useNewUrlParser: true
        }, function(err, client) {
            let db = client.db("fcc");


            app.use(cors());
            app.use(bodyParser.json());
            app.use(bodyParser.urlencoded({
                extended: true
            }));
            /** this project needs to parse POST bodies **/
            // you should mount the body-parser here
            //app.use(bod

            app.use('/public', express.static(process.cwd() + '/public'));

            app.get('/', function(req, res) {
                res.sendFile(process.cwd() + '/views/index.html');
            });


            app.post("/api/shorturl/new", function(req, res) {

                    //get the url submitted to api post method.
                    //console.log(JSON.stringify(req.body));
                    let url = req.body.url;

                    if (url) {
                        //check if url is valid url 
                        //use regex to check if it follows the url pattern.
                        //http(s)://www.example.com(/more/routes)
                        //if (url == /https*:\/\/www\.\w+\.com(\/\w+)* /)
                        //url="https://www.google.com$f";
                        //url="http://www.google.com";
                        //console.log(url);
                        if (/https*:\/\/www\.\w+\.com(\/\w+)*$/.test(url)) {
                            console.log("matched");
                            //if matched find the hostname and lookup.
                            let hostname = url.match(/www\.\w+\.com/);
                            console.log(hostname[0]);
                            //dns.lookup(hostname[0],);
                            dns.lookup(hostname[0], function(err, addresses, family) {
                                    if (err) {
                                        //looks like the address is wrong.
                                        res.json({
                                            "error": "invalid URL"
                                        });
                                    } else {
                                        console.log(addresses);
                                        //now keep this url in database.
                                        //keep index in one more collection.
                                        //db.collection("value").find();
                                        db.collection('urls').stats(function(err, x) {
                                                if (err) {
                                                    console.log('err from stats' + err);
                                                }
                                          
                                                if (x == null) {
                                                 console.log('inside null');
                                                    db.collection('urls').insertOne({
                                                        original_url: url,
                                                        short_url: 1
                                                    }, function(err, doc1) {
                                                        //if doc is null , then use short url value as 1.
                                                        res.json({
                                                            original_url: url,
                                                            short_url: 1
                                                        });
                                                    });


                                                } else {

                                                    db.collection('urls').find({}).sort({
                                                            "short_url": -1}).toArray(function(err, doc) {

                                                            
                                                                if (err) {
                                                                    console.log(err);
                                                                } else {
                                                                    console.log('doc' + doc);
                                                                    if (doc && doc[0]) {
                                                                        let newshorturl = doc[0].short_url + 1;
                                                                        db.collection('urls').insertOne({
                                                                            original_url: url,
                                                                            short_url: newshorturl
                                                                        }, function(err, doc1) {
                                                                            if (err) {
                                                                                console.log('error while inserting into urls collection');
                                                                            } else {
                                                                                //console.log("1 document inserted");
                                                                                //return from here the response.
                                                                                res.json({
                                                                                    original_url: url,
                                                                                    short_url: newshorturl
                                                                                });
                                                                                // db.close();
                                                                            }
                                                                        });


                                                                    } else if (doc == null) {

                                                                        console.log('check wht needs to be done here');
                                                                    }
                                                                }

                                                            } );


                                                    }




                                                });




                                        }
                                    });

                            }

                            //dns(host,cb)
                        }


                        //dns.lookup(host, cb)
                        //res.json({greeting: 'hello API'});
                    });

                // your first API endpoint... 
                app.get("/api/hello", function(req, res) {
                    res.json({
                        greeting: 'hello API'
                    });
                }); 
                          
                          
                    app.get("/api/shorturl/:c?", function(req, res) {
                    //res.json({greeting: 'hello API'});
                    console.log('shorurl is ' + req.params.c);
                    if (req.params.c) {
                        //query the database for shorturl and find the orginal url and redirect to it.
                        db.collection('urls').findOne({
                            short_url: parseInt(req.params.c)
                        }, {
                            short_url: 0,
                            _id: 0
                        
                        }, function(err, doc) {
                            if (err) {
                                console.log('err while querying');
                            } else {
                              if(doc){
                                console.log('orginal url ' + doc.original_url);
                                res.redirect(doc.original_url);
                              }
                            }


                        });

                    }

                });




                app.listen(port, function() {
                    console.log('Node.js listening ...');
                });

            });