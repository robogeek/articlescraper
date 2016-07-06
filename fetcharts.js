
'use strict';

const util    = require('util');
const url     = require('url');
const fs      = require('fs-extra-promise');
const path    = require('path');
const request = require('request');
const cheerio = require('cheerio');
const yaml    = require('js-yaml');
const async   = require('async');

const topdir = "grnt";


var config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));

var index = yaml.safeLoad(fs.readFileSync(path.join(config.archive.topdir, 'index.yaml'), 'utf8'));

async.eachSeries(index,
function(item, next) {
    // We need to do one at a time to avoid overloading Node.js
    fetchArticle(item.url)
    .then(article => {
        // console.log(util.inspect(article));
        return fs.ensureDirAsync(path.join(config.archive.topdir, article.timestamp))
        .then(() => { return article; });
    })
    .then(article => {
        return fs.writeFileAsync(path.join(config.archive.topdir, article.timestamp, "article.yaml"),
                yaml.safeDump(article), 'utf8')
        .then(() => { return article; });
    })
    .then(article => { return fetchImages(article); })
    .then(() => { next(); })
    .catch(err => { next(err); });
},
function(err) {
    if (err) console.error(err.stack);
    else console.log("all DONE");
});


function fetchArticle(reqpath) {
    return new Promise((resolve, reject) => {
        var requrl = url.format({
            protocol: config.host.protocol, hostname: config.host.hostname,
            pathname: reqpath
        });
        request(requrl, function(err, resp, body) {
            if (err) return reject(err);

            console.log('ARTICLE '+ requrl);
            var $ = cheerio.load(body);

            /* console.log(`

    TITLE: ${$('article h1.page-title').text()}
    TIME:  ${$('article div.article-socialtime time').attr('datetime')}

    BODY:  ${$('article section.article-content div.field-item').html()}

            `); */

            var imgs = [];
            $(config.articleselectors.images).each(function(i, elem) {
                imgs.push($(this).attr('src'));
            });

            var bodytxt = "";
            $(config.articleselectors.body).each(function(i, elem) {
                bodytxt += $(this).html();
            });

            resolve({
                url: requrl,
                title: $(config.articleselectors.title).text(),
                timestamp: $(config.articleselectors.timestamp).attr('datetime'),
                body: bodytxt, // $(config.articleselectors.body).html(),
                images: imgs
            });
            
        });
    });
}

function fetchImages(article) {
    return new Promise((resolve, reject) => {
        async.eachSeries(article.images,
        function(imageurl, done) {
            var urlp = url.parse(imageurl);
            if (! urlp.hostname) {
                urlp.protocol = config.host.protocol;
                urlp.hostname = config.host.hostname;
            }
            // Skip utilitiarian images that we don't want
            if (urlp.hostname === 'static.addtoany.com') { return done(); }
            if (urlp.pathname.match(/clicktoplay/) !== null) { return done(); }
            // console.log(imageurl);
            // console.log("FETCHED "+ urlp.format());
            request(urlp.format())
            .on('error', err => { console.error(err.stack); done(); })
            .on('response', response => {
                console.log(response.statusCode +' '+ response.headers['content-type'] +' '+ urlp.format());
            })
            .on('end', () => { console.log('REQUEST emitted END'); done(); })
            .pipe(fs.createWriteStream(
                path.join(config.archive.topdir, article.timestamp, path.basename(urlp.pathname))));
        },
        function(err) {
            if (err) reject(err);
            else resolve(article);
        });
    });
}
