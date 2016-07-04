These scripts are focused on one goal:  Extracting articles from websites using an "index page" to locate the articles.  For example, a Wordpress category page or blog index, where it will be one or more pages containing links to articles with teasers and perhaps an image.  One script, `mkindex.js`, traverses the index page(s) and extracts the links to a YAML data file.  The second script, `fetcharts.js`, opens each of the linked pages, reading the article title, body, and other information, saving that to files, and also downloading any images that are found.

Of course it is possible to use this for evil - that is, downloading other peoples articles and then reposting them elsewhere.  Don't be evil.  Use these scripts to download your own articles.  For example, I wrote these scripts because I've written a large body of articles on other sites.  One, examiner.com, is about to go out of business and all my hard work on that site will go poof.  Examiner never asserted any ownership of the articles I posted there, and therefore those are my articles under my ownership.  But, Examiner is not providing any mechanism to download the articles, and therefore if I'm going to resurrect those articles somewhere I had to write this script to retrieve the articles.

I own the articles, and am planning to repost them elsewhere.  That's the smart ethical correct way to use these scripts.

# STEP 0: Configuration

There are two scripts, and the two of them need data about the website you're scraping.  We store that information in a configuration file, `config.yaml`. As the file name implies, it is a YAML file.  You won't need to know YAML extensively, it's a very simple config file.  We'll go over the necessary parts as we go.

One key thing in the configuration is jQuery-like selectors to access data from the page.  The scripts are written in Node.js, and use the Cheerio library to use it's jQuery-like API to simplify extracting data using the DOM of each page.

# STEP 0.5: Installation

You must of course first have Node.js installed on your laptop.  See https://nodejs.org/en/download/ for more information on doing so.

I don't feel these scripts are worthy of being in the NPM repository.  Therefore, install it this way:

```
$ npm install robogeek/articlescraper
```

See?  We can get the advantages of NPM without having to publish there.

# STEP 1: Make article index

A typical website paradigm is the "index page" listing article summaries.  The stereotypical blog front page is such an index page, listing article summaries in reverse-chronological-order.  As soon as there gets to be enough articles, the article list will be split over multiple pages.  You select the pages using `?page=##` in the URL, so that the access URL is something like `http://example.com/path/to/index?page=##`

Part of the `config.yaml` lists information required to navigate those pages and extract data.

Once we have `config.yaml` run:

```
$ node mkindex
```

It will create a file, `index.yaml`, in the directory described in `config.yaml`, so let's talk about that file.

```
host:
    protocol: 'http'
    hostname: 'www.examiner.com'
    pathname: '/green-transportation-in-national/david-herron'
    numpages: 45
```

This first section is used in both scripts, and describes where the index page resides.  This is one of my index pages on Examiner.com.  The `protocol` parameter is going to be either `http` or `https`, and the other fields are self-explanatory.  The `numpages` parameter says how far to go with `?page=##` traversal of the website.

The `mkindex` script will retrieve that URL from `?page=0` to the `?page=##` matching the value in `numpages`.

```
indexselectors:
    item: 'div.index-listing article'
    itemtitle: '.media__body a'
    timestamp: '.media__body time'
    teaser: '.copy .field-item'
```

As I said, these scripts use a jQuery-work-alike library called Cheerio.  These selectors describe where on the page to look for the data.  The last three are selected within the context specified by the `item` selector.

These selectors work for Examiner.com.  To use this for another website will mean adjusting the selectors to match that site.

```
archive:
    topdir: 'grnt'
```

All fetched data will be stored in this directory.  At this stage it amounts to the `index.yaml`, and with this definition that will land as `grnt/index.yaml`.

# STEP 2: Fetching articles and images

Now that we have an index of the articles to fetch, we can do so.  If you look in `index.yaml` you'll see entries like this:  

```
- title: Jeremiah Johnson to race with U of Nottingham in MotoE racing series
  url: /article/jeremiah-johnson-to-race-with-u-of-nottingham-motoe-racing-series
  timestamp: '2016-06-20T20:24:16-06:00'
  teaser: >-
    On Sunday, the University of Nottingham Electric Superbike race team
    announced that American motorcycle racer Jeremiah Johnson would return to
    their saddle for the 2016 MotoE electric motorcycle racing season. The team
    is fresh from the Isle of Man...
- title: >-
    Solar Impulse making historic first solar-powered airplane Atlantic
    crossing
  url: >-
    /article/solar-impulse-making-historic-first-solar-powered-airplane-atlantic-crossing
  timestamp: '2016-06-20T19:25:22-06:00'
  teaser: >-
    At 2:30 AM Monday morning, Solar Impulse 2 pilot Bertrand Piccard took off
    from JFK International Airport for a historic first flight of a solar
    powered electric airplane crossing the Atlantic Ocean. The flight will take
    almost four...
```

If you know YAML, you know this is an array of objects with fields named `title`, `url`, `timestamp` and `teaser`.

This next script only uses the `url` field but the other data is there if you want to use it for some other purpose.

We have one more section to add to `config.yaml` and then we'll be good to go:

```
articleselectors:
    images: 'article section.article-content img'
    title: 'article h1.page-title'
    timestamp: 'article div.article-socialtime time'
    body: 'article section.article-content div.field-item'
```

These are used on the article page to select data from the page.  These selectors will work for Examiner.com articles, and of course will have to be rewritten for another site.

The articles will be saved as `topdir/timestamp/article.yaml` and any images in the page will be downloaded to the same directory.

After you have `config.yaml` squared away, run:

```
$ node fetcharts
```

# STEP 3: Doing something with the articles

The `article.yaml` files are of course encoded in YAML.  They contain fields named `title`, `timestamp`, `url`, `body`, and `images`.  The latter is an array of URL's for images found in the article.

We don't have a script written to use this data.  My intention is to import them into a Wordpress blog, which of course will involve a PHP script.  
