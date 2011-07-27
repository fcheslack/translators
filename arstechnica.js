{
    "translatorID": "96b9f483-c44d-5784-cdad-dce7531cb3a3",
    "label": "arstechnica.com",
    "creator": "Faolan Cheslack-Postava",
    "target": "^https?://arstechnica",
    "minVersion": "1.0.0b4.r1",
    "maxVersion": "",
    "priority": 100,
    "inRepository": true,
    "translatorType": 4,
    "browserSupport": "g",
    "lastUpdated": "2011-07-14 15:16:39"
}

/*
 * Should work on all individual blog posts and search pages (but not forum posts yet) on arstechnica.com
 * http://arstechnica.com/web/news/2009/06/thomson-reuters-suit-against-zotero-software-dismissed.ars
 * http://arstechnica.com/search/#zotero
 * including multiple snapshots for multi-page posts
 * http://arstechnica.com/telecom/guides/2010/03/voip-in-depth-an-introduction-to-the-sip-protocol-part-2.ars/3
 */

function detectWeb(doc, url) { 
    var namespace = doc.documentElement.namespaceURI;
    var nsResolver = namespace ? function(prefix) {
        if (prefix == 'x') return namespace; else return null;
    } : null;
    
    var frontPageXpath = '//div[@class="story-inner"]';
    var mainStoryXpath = '//div[@id="story"]';
    var searchResultsXpath = '//div[@id="generic-page"]/h2[@class="title"]';
    var xpathvar;
    
    if((xpathvar = doc.evaluate(searchResultsXpath, doc, nsResolver, XPathResult.ANY_TYPE, null).iterateNext()) && (xpathvar.textContent == "Ars Search")){
        return "multiple";
    }
    else if(doc.evaluate(mainStoryXpath, doc, nsResolver, XPathResult.ANY_TYPE, null).iterateNext()){
        return "blogPost";
    }
}

function doWeb(doc, url) {
    Zotero.debug("Debugging Arstechnica Translator\n\n");
    var namespace = doc.documentElement.namespaceURI;
    var nsResolver = namespace ? function(prefix) {
        if (prefix == 'x') return namespace; else return null;
    } : null;
    
    var story;
    var articles = new Array();
    var availableItems = new Object();
    var selectedItems = new Array();
    var nextTitle;
    
    var detectType = detectWeb(doc, url);
    
    if(detectType == "multiple"){
        //Search Results Page
        Zotero.debug("Search Results");
        var searchTitlesXpath = doc.evaluate('//div[@class="gsc-webResult gsc-result"]/div[@class="gs-webResult gs-result"]/div[@class="gs-title"]/a[@class="gs-title"]', doc, nsResolver, XPathResult.ANY_TYPE, null);
        //var postRe = new RegExp('^https?://arstechnica\.com/[\w/\-]+\.ars(?:/\d)*');
        var postRe = new RegExp('^https?://arstechnica\.com/[-/a-zA-Z0-9_]+\.ars(?:/\d)*$');
        while(nextTitle = searchTitlesXpath.iterateNext()){
            if(postRe.test(nextTitle.href)) {
                availableItems[nextTitle.href] = nextTitle.textContent;
            }
        }
        Zotero.debug(availableItems);
        selectedItems = Zotero.selectItems(availableItems)
        Zotero.debug(selectedItems);
        for (var i in selectedItems) {
            articles.push(i);
        }
        Zotero.debug(articles);
    }
    else if(detectType == "blogPost"){
        //individual post
        Zotero.debug("Individual post");
        articles.push(url);
    }
    
    Zotero.debug(articles);
    for(var i = 0; i < articles.length; i++){
        if(articles[i] == url){
            scrape(doc, url);
        }
        else{
            var newdoc = Zotero.Utilities.retrieveDocument(articles[i]);
            scrape(newdoc, articles[i]);
        }
    }
    return true;
}

function scrape(doc, url) {
    var namespace = doc.documentElement.namespaceURI;
    var nsResolver = namespace ? function(prefix) {
        if (prefix == 'x') return namespace; else return null;
    } : null;
    
    var newItem = new Zotero.Item("blogPost");
    
    var items = new Object();
    var authorXpath = doc.evaluate('//span[@class="author"]/a', doc, nsResolver, XPathResult.ANY_TYPE, null);
    var titleXpath = doc.evaluate('//h2[@class="title"]', doc, nsResolver, XPathResult.ANY_TYPE, null);
    var dateXpathUpdated = doc.evaluate('//span[@class="posted"]/span[@class]/abbr/@original-title', doc, nsResolver, XPathResult.ANY_TYPE, null);
    var dateXpathOrig = doc.evaluate('//span[@class="posted"]/span[@class]/abbr/@title', doc, nsResolver, XPathResult.ANY_TYPE, null);
    var abstractXpath = doc.evaluate('//head/meta[@name="description"]/@content', doc, nsResolver, XPathResult.ANY_TYPE, null);
    var keywordsXpath = doc.evaluate('//head/meta[@name="keywords"]/@content', doc, nsResolver, XPathResult.ANY_TYPE, null);
    
    newItem.title = titleXpath.iterateNext().textContent;
    newItem.url = doc.location.href;
    newItem.blogTitle = "Ars Technica";
    newItem.websiteType = "Ars Technica Blog";
    newItem.language = "English";
    newItem.abstractNote = abstractXpath.iterateNext().textContent;
    
    Zotero.debug("1");
    
    //the date format used changed at some point, so use date object to parse
    try{
        date = new Date(dateXpathUpdated.iterateNext().textContent);
        newItem.date = date.getFullYear() + "-" + 
                       Zotero.Utilities.lpad((date.getMonth() + 1), '0', 2) + "-" + 
                       Zotero.Utilities.lpad(date.getDate(), '0', 2) + " " + 
                       Zotero.Utilities.lpad(date.getHours(), '0', 2) + ":" + 
                       Zotero.Utilities.lpad(date.getMinutes(), '0', 2) + ":" + 
                       Zotero.Utilities.lpad(date.getSeconds(), '0', 2);
    }
    catch(e){
        Zotero.debug("exception trying to parse date");
    }
    //the date format used changed at some point, so use date object to parse
    try{
        date = new Date(dateXpathOrig.iterateNext().textContent);
        newItem.date = date.getFullYear() + "-" + 
                       Zotero.Utilities.lpad((date.getMonth() + 1), '0', 2) + "-" + 
                       Zotero.Utilities.lpad(date.getDate(), '0', 2) + " " + 
                       Zotero.Utilities.lpad(date.getHours(), '0', 2) + ":" + 
                       Zotero.Utilities.lpad(date.getMinutes(), '0', 2) + ":" + 
                       Zotero.Utilities.lpad(date.getSeconds(), '0', 2);
    }
    catch(e){
        Zotero.debug("exception trying to parse date");
    }
    var author = authorXpath.iterateNext().textContent;
    newItem.creators.push(Zotero.Utilities.cleanAuthor(author, "author"));
    
    //get keywords to use as tags
    var keywords = keywordsXpath.iterateNext().textContent.split(", ");
    Zotero.debug(keywords);
    newItem.tags = keywords;
    
    //see if there are page links
    
    var pagerXpath = doc.evaluate('//div[@id="story"]/div[@class="pager"]/ul/li/a', doc, nsResolver, XPathResult.ANY_TYPE, null);
    var selectedPageXpath = doc.evaluate('//div[@id="story"]/div[@class="pager"]/ul/li[@class="selected"]', doc, nsResolver, XPathResult.ANY_TYPE, null)
    var pageurls = {};
    var selectedPage;
    
    Zotero.debug("2");
    if(selectedPage = selectedPageXpath.iterateNext()){
    Zotero.debug("30");
        newItem.attachments.push({document:doc, title:"Page " + selectedPage.textContent + " " + newItem.title + " Snapshot"});
        Zotero.debug("current page is: " + selectedPage.textContent);
        var pageRange;
        while(pageRange = pagerXpath.iterateNext()){
        Zotero.debug("35");
        Zotero.debug("nonCurrent page: " + pageRange.textContent + " " + pageRange.href);
            pageurls[pageRange.textContent] = pageRange.href;
        }
        for(var i in pageurls){
        Zotero.debug("page url: " + pageurls[i]);
            newItem.attachments.push({url:pageurls[i], title:"Page " + i + " " + newItem.title + " Snapshot", snapshot:true, mimeType:"text/html"});
        }
        Zotero.debug(pageurls);
    }
    else{
    Zotero.debug("40");
    Zotero.debug("only one page: " + url);
    newItem.attachments.push({document:doc, title:newItem.title + " Snapshot"});
        //newItem.attachments.push({url:url, title:newItem.title + " Snapshot"});
    }
    Zotero.debug("50");
    //newItem.attachments.push({document:doc, title:newItem.title + " Snapshot"});
    
    newItem.complete();
}

