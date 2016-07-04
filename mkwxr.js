
'use script';

const util     = require('util');
const url      = require('url');
const path     = require('path');
const fs       = require('fs-extra-promise');
const cheerio  = require('cheerio');
const yaml     = require('js-yaml');
const Importer = require('wxr');
const importer = new Importer();
const globfs   = require('globfs');
const async    = require('async');

const authorname = ".... your user name";
const categoryslug = "news";

return new Promise((resolve, reject) => {
    globfs.operate([ 'path/to/articles/directory' ], [ '**/article.yaml' ],
	function(basedir, fpath, fini) { fini(null, path.join(basedir, fpath)); },
	function(err, results) {
        if (err) reject(err);
        else resolve(results);
	});
})
.then(articlelist => {
    return new Promise((resolve, reject) => {
        async.eachSeries(articlelist,
        (articlefn, done) => {
            // console.log(util.inspect(articlefn));
            fs.readFileAsync(articlefn.fullpath)
            .then(data => yaml.safeLoad(data) )
            .then(article => {
                // console.log(util.inspect(article));
                importer.addPost({
                  // id            : 10,
                  title         : article.title,
                  // name          : "why-js-is-so-awesome",
                  // description   : "Quick tips about JS",
                  date          : article.timestamp,
                  status        : "draft",
                  author        : authorname,
                  contentEncoded: article.body,
                  // excerptEncoded: "Cool preview for my post. Check it out!",
                  categories    : [
                    {
                      slug: categoryslug
                    }
                  ]
                });
                done();
            })
            .catch(err => { done(err); });
        },
        err => {
            if (err) reject(err);
            else resolve();
        });
    })
})
.then(() => fs.writeFileAsync("articles.wxr", importer.stringify(), 'utf8') )
.catch(err => { console.error(err.stack ? err.stack : err); });
