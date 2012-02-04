
if(!net) var net={};
if(!net.dewdrops) net.dewdrops={};

net.dewdrops.SiteSearch = function() {
  var pub = {};
  pub.SITES = '';
  pub.MAX_DOMAINS = 25;  // cutoff for most domains to use in a search
  pub.MAX_HISTORY = 10000; // go back this many history elems (for speed)
  pub.NUM_DOMAINS = 0;
  pub.LAST_SITE = '';
  pub.Domain = function(theURL, theCount) {
      this.url = theURL;
      this.count = theCount;
  };
  pub.sortDomain = function(a, b) {
      return b.count - a.count;
  };
  pub.trimString = function(s) {
      s = s.replace( /^\s+/g, "" );// strip leading
      return s.replace( /\s+$/g, "" );// strip trailing    
  }

  pub.getBoolPref = function(prefName) {
      var prefValue = true;
      try {
          prefValue = Components.classes["@mozilla.org/preferences-service;1"]
                      .getService(Components.interfaces.nsIPrefBranch)
                      .getBoolPref(prefName);
      } catch (e) { } ;
      return prefValue;
  }

  //
  // code for right click
  //
  pub.sitesearchselection = function(isHostSearch) {
      var focused_window = document.commandDispatcher.focusedWindow;
      var text = encodeURIComponent(focused_window.getSelection());

      if (text == null) text = '';
      pub.sitesearch(text, isHostSearch, true);    
  }


  //
  // toolbar functions
  //
  pub.hide_toolbar = function() {
      toolbar = document.getElementById('sitesearch-toolbar');
      toolbar.collapsed = true;
  }


  // IDs of the default CSEs
  pub.CSEDrewSearch = '004961861728436980931%3Ahvx9p6midty';
  pub.CSEDefault = '011728537687655009530%3Ao7u-bn_5me4';

  pub.search = function() {

      var searchtext = document.getElementById('sitesearchbox').value;
      var menulist = document.getElementById('searchtype');
      if ("topsitesearch" == menulist.value) {
          pub.topsitesearch(searchtext);
      } else if ("hostsearch" == menulist.value) {
          pub.sitesearch(searchtext, true, false);
      } else if ("sitesearch" == menulist.value) {
          pub.sitesearch(searchtext, false, false);
      } else if ("drewwebsearch" == menulist.value) {
          pub.websearch(searchtext, pub.CSEDrewSearch);
      } else if ("websearch" == menulist.value) {
          pub.websearch(searchtext, pub.CSEDefault);
      } else {
          pub.sitesearch(searchtext, false, false);
      }
  }

  pub.sitesearch = function(searchterms, isHostSearch, isRightClick) {
      pub.status("");
      var currentURI = getBrowser().currentURI;
      if (currentURI == null) {
          pub.status('No current site. Navigate somewhere first.');
          return;
      }
      var host = currentURI.host;
      if (currentURI.port != '-1') {
          host += ':' + currentURI.port
      }
      var parts = host.split('.');
      var domain = '';
      if (parts.length >= 3 &&
          (parts[parts.length-2] == 'co' || parts[parts.length-2] == 'com')) {
	  // for international: bbc.co.uk, etc.
	  domain = parts[parts.length-3] + "." + parts[parts.length-2] + "." +
	           parts[parts.length-1];
      } else if (parts.length >= 1) {
	  domain = parts[parts.length-2] + "." + parts[parts.length-1];
      }

      if (currentURI.spec.indexOf('google.com/custom') > -1 &&
	  pub.LAST_SITE != '') { // we're doing a search, so re-use last site
          domain = pub.LAST_SITE;
          host = pub.LAST_SITE;
      }   

      var url = 'http://www.google.com/custom?hl=en&client=google-coop&cof=AH%3Aleft%3BCX%3ASite%2520Search%2520Extension%3BL%3Ahttp%3A%2F%2Fwww.google.com%2Fcoop%2Fintl%2Fen%2Fimages%2Fcustom_search_sm.gif%3BLH%3A65%3BLP%3A1%3BVLC%3A%23551a8b%3BGFNT%3A%23666666%3BDIV%3A%23cccccc%3B&adkw=AELymgW7NXaEzEr8q80yndqKh_1RzzNHSzOaMHmd84Uou_lBMKEMf0iaOK28xHp9XyYXO683qFEd_DeklsyvBG-CSvHrw09xWcHw6UU0lfRorYaQ87tGxWI&btnG=Search&cx=' +
        pub.CSEDefault + '&q=' + searchterms + '+site%3A' +
        (isHostSearch ? host : domain)  + '&';

      var openNewTab = (isRightClick ? 
		      pub.getBoolPref("extensions.sitesearch@dewdrops.net.rightclick-opennewtab") :
		      pub.getBoolPref("extensions.sitesearch@dewdrops.net.toolbar-opennewtab") );
      if (openNewTab) {
  	  var newTab = getBrowser().addTab(url);
	  getBrowser().selectedTab = newTab;
      } else {
	  getBrowser().loadURI(url, null, null);
      }

      if (isHostSearch) {
          pub.status('Searching host: ' + host);
          pub.LAST_SITE = host;
      } else {
          pub.status('Searching site: ' + domain);    
          pub.LAST_SITE = domain;
      }
  }

  pub.websearch = function(searchterms, CSE) {
      pub.status("");
      var url = 'http://www.google.com/cse?cx=' + CSE + 
                '&ie=UTF-8&sa=Search&q=' + searchterms;

      if (pub.getBoolPref("extensions.sitesearch@dewdrops.net.toolbar-opennewtab")) {
	  var newTab = getBrowser().addTab(url);
	  getBrowser().selectedTab = newTab;
      } else {
	  getBrowser().loadURI(url, null, null);
      }
  }

  pub.topsitesearch = function(searchterms) {
    pub.status("");

    if (pub.SITES == '') pub.createengine(); // init sites list
    if (pub.SITES == '') return;

    // GOOG doesn't allow multiple sites passed in, so we use Bing
    var url = 'http://www.bing.com/search?q=' + pub.trimString(searchterms) +
                                                '+%28' + pub.SITES + '%29';
    if (pub.getBoolPref("extensions.sitesearch@dewdrops.net.toolbar-opennewtab")) {
	var newTab = getBrowser().addTab(url);
	getBrowser.selectedTab = newTab;
    } else {
	getBrowser().loadURI(url, null, null);
    }
    pub.status('Using your ' + pub.NUM_DOMAINS + ' most visited sites.');

    // update list of SITES
    pub.createengine();
  }

  pub.createengine = function() {

      var historyService =
          Components.classes["@mozilla.org/browser/nav-history-service;1"]
          .getService(Components.interfaces.nsINavHistoryService);

      var query = historyService.getNewQuery();

      // no params returns everything
      var options = historyService.getNewQueryOptions();
      options.sortingMode = options.SORT_BY_VISITCOUNT_DESCENDING;
      options.resultType = options.RESULTS_AS_VISIT;
      // options.queryType = options.QUERY_TYPE_UNIFIED;

      var result = historyService.executeQuery(query, options);
      var domainCountsMap = [];  // domain -> count
      pub.getDomains(result.root, domainCountsMap, 0);

      var domains = [];
      for (var url in domainCountsMap) {
        if (url == 'null' || url.indexOf('localhost') > -1) { 
	      continue;
	  }
          var domain = new pub.Domain(url, domainCountsMap[url]);
          domains.push(domain);
      }
      domains.sort(pub.sortDomain);

      if (domains.length < 1) {    
          pub.status("No history! Do some browsing first.");
          return;
      }

      pub.NUM_DOMAINS = (domains.length < pub.MAX_DOMAINS ? domains.length : pub.MAX_DOMAINS);
      pub.SITES = '';
      for (var i=0; i < domains.length && i < pub.MAX_DOMAINS; i++) {
	  pub.SITES += 'site%3A' + domains[i].url + "+OR+"
      }
  }

  pub.getDomains = function(node, resultMap, nodesCount) {
      node.containerOpen = true;
      for (var i=0; i < node.childCount; i++) {
	  if (nodesCount > pub.MAX_HISTORY) {
	      return;
	  }
          var childNode = node.getChild(i);
          var type = childNode.type;
          if (type == Components.interfaces.nsINavHistoryResultNode.
                      RESULT_TYPE_URI ||
              type == Components.interfaces.nsINavHistoryResultNode.
                      RESULT_TYPE_VISIT) {
              var domain = pub.getDomain(childNode.uri);
              if (domain == "undefined.") {
                  continue; // skip undefined domains
              }
              if (resultMap[domain] == null) {
                  resultMap[domain] = 1;
              } else {
                  resultMap[domain]++;
              }
          } else if (type == 
                     Components.interfaces.
                     nsINavHistoryResultNode.RESULT_TYPE_FOLDER) {
              childNode.QueryInterface(Components.interfaces.
                                       nsINavHistoryContainerResultNode);
              childNode.containerOpen = true;
              nodesCount += pub.getDomains(childNode, resultMap, nodesCount);
              childNode.containerOpen = false;
          }
      }
      node.containerOpen = false;
      return nodesCount;
  }


  //
  // Helpers
  //
  pub.status = null;
  pub.status = function(s) {
      if (pub.status == null) {
          pub.status = document.getElementById('statuslabel');
      }
      pub.status.value = s;
  }
  pub.getDomain = function(uri) {
      if (!uri) return null;
    
      if (uri.substring(0,4) != 'http') return null;    
      var host = uri.substring(7).split('/')[0];
      var parts = host.split('.');
      if (parts.length < 2) {
	  return null;
      }
      return parts[parts.length-2] + "." + parts[parts.length-1];
  }

  return pub;
}();



