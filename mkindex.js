
'use strict';

const util    = require('util');
const url     = require('url');
const path    = require('path');
const fs      = require('fs-extra-promise');
const request = require('request');
const cheerio = require('cheerio');
const yaml    = require('js-yaml');

// http://www.examiner.com/green-transportation-in-national/david-herron?page=45&no_cache=1467475326
// http://www.examiner.com/green-living-in-national/david-herron
// http://www.examiner.com/environment-in-national/david-herron


var config = yaml.safeLoad(fs.readFileSync('config.yaml', 'utf8'));

var indexque = [];

for (let pn = 0; pn <= config.host.numpages; pn++) {
    indexque.push(new Promise((resolve, reject) => {
        var requrl = url.format({
            protocol: config.host.protocol, hostname: config.host.hostname,
            pathname: config.host.pathname,
            query: {
                page: pn,
                no_cache: 5647893
            }
        });
        // console.log(requrl);
        request(requrl, function(err, resp, body) {
            if (err) return reject(err);

            var $ = cheerio.load(body);

            var indexdata = [];
            $(config.indexselectors.item).each(function(i, elem) {
                indexdata.push({
                    title: $(this).find(config.indexselectors.itemtitle).text(),
                    url: $(this).find(config.indexselectors.itemtitle).attr('href'),
                    timestamp: $(this).find(config.indexselectors.timestamp).attr('datetime'),
                    teaser: $(this).find(config.indexselectors.teaser).text()
                });
            });
            // console.log(util.inspect(indexdata));
            resolve(indexdata);
        });
    }))
}

Promise.all(indexque)
.then(indexes => {
    var ret = [];
    indexes.forEach(item => { ret = ret.concat(item); })
    // console.log(util.inspect(ret));
    return ret;
})
.then(indexes => {
    // console.log(util.inspect(indexes));
    var yml = yaml.dump(indexes);
    // console.log(yml);
    var file2write = path.join(config.archive.topdir, 'index.yaml');
    console.log('writing '+ file2write);
    fs.ensureDirSync(config.archive.topdir);
    fs.writeFileSync(file2write, yml, 'utf8');
})
.catch(err => {
    console.error(err.stack);
});
