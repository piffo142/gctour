// init core variables
function initCore(){

	// setting up the language
	lang = languages[GM_getValue('language',1)];
	
	// getting all tours
	tours = loadValue('tours',new Array());
	
	//eval(GM_getValue('tours',new Array()));
	// structur a tour:
	// id 		<--- int
	// name 	<--- string
	// caches 	<--- caches
	
	
	
	// go get the current tour from the tour list
	currentTourId = GM_getValue('currentTour',-1);
	currentTour = getTourById(currentTourId);
	
	
	

	// oh - there is no current tour!? create one!
	if(!currentTour){
		currentTour = new Object();
		currentTour.id = getNewTourId();		
		currentTour.name = "Tour "+currentTour.id;
		currentTour.geocaches = new Array();
		tours.push(currentTour);
		log("found no currentTour! Creating new one: "+currentTour.id +" ; "+ currentTour.name);
		saveCurrentTour();
	} 
	
	
	checkOnlineConsistent(currentTour);
}

function initDojo(){
	// just dont start the script on the gc.com print page!
	if(document.URL.search("cdpf\.aspx")<=0) {

		var requiredModules, script;

        // required modules - add dojo stuff here
		requiredModules = [];
		requiredModules.push("dojo.fx");
	    requiredModules.push("dojo.parser");
		requiredModules.push("dojo.dnd.Source");
		requiredModules.push("dojo.date.locale");
		requiredModules.push("dojo.number");

		 

		unsafeWindow.djConfig = {afterOnLoad: true, require: requiredModules,locale: 'en'};  		
		script = appendScript(dojoPath + "/dojo/dojo.xd.js");
		
		
		// check after 20sec if dojo is loaded - otherwhise asume user is blocking Javascript (possible false positve)
		window.setTimeout(function(){
			if(!dojo){
			   alert(lang["SCRIPT_ERROR"]);
			}
		},20000);
		
		// only way to check if the dojo script is loaded - addOnLoad fails because of unsafeWindow scope
		script.addEventListener('load', function(event){
			dojo = unsafeWindow.dojo;
			
			// if dojo is ready to go ( include all required modules ), init GCTour
			dojo.addOnLoad(function(){ 
			        setTimeout(function() { // hack to prevent "access violation" from Greasemonkey http://wiki.greasespot.net/0.7.20080121.0_compatibility
                        init();
                    },0);
                });		
		}, 'false');
	}
}

function init(){			
	
	
		// adding styles:
	   GM_addStyle(
	    '.dojoDndAvatar {font-size: 75%; color: black;min-width:130px;z-index: 100003 !important;width:180px}'+
	    '.dojoDndAvatar .controls{display:none;}'+
	    '.dojoDndAvatarHeader td	{padding-left: 20px; padding-right: 4px;}'+
	    '.dojoDndAvatarHeader	{background: #ccc;}'+ 
	    '.dojoDndAvatarItem		{background: #eee;}'+
	    '.dojoDndItemBefore		{border-top:3px solid gray !important; }'+
	    '.dojoDndItemAfter		{border-bottom:3px solid gray !important;}'+
	    '.dojoDndItemOver		{background-color:#edf1f8}'+
	    '.dojoDndMove .dojoDndAvatarHeader	{background-image: url(http://ajax.googleapis.com/ajax/libs/dojo/1.2.0/dojo/resources/images/dndNoMove.png); background-repeat: no-repeat;}'+
	    '.dojoDndCopy .dojoDndAvatarHeader	{background-image: url(http://ajax.googleapis.com/ajax/libs/dojo/1.2.0/dojo/resources/images/dndNoCopy.png); background-repeat: no-repeat;}'+
	    '.dojoDndMove .dojoDndAvatarCanDrop .dojoDndAvatarHeader	{background-image: url(http://ajax.googleapis.com/ajax/libs/dojo/1.2.0/dojo/resources/images/dndMove.png); background-repeat: no-repeat;}'+ 
	    '.dojoDndCopy .dojoDndAvatarCanDrop .dojoDndAvatarHeader	{background-image: url(http://ajax.googleapis.com/ajax/libs/dojo/1.2.0/dojo/resources/images/dndCopy.png); background-repeat: no-repeat;}'
	);
	
	
	// dialog styles
	GM_addStyle(
		'.dialogMask {background-image:url('+dialogMaskImage+');height:100%;left:0;opacity:0.7;position:fixed;top:0;width:100%;z-index:9000000;}'+
		'.dialogBody{-moz-border-radius:5px;background:none repeat scroll 0 0 #fff;border:1px solid #333333;color:#333333;cursor:default;font-family:Arial;font-size:12px;left:50%;margin-left:-250px;margin-top:20px;padding:0 0 1em;position:fixed;text-align:left;top:0;width:500px;z-index:9000010;max-height:85%;min-height:370px;overflow:auto;}'+
		'.dialogBody p {font-size:12px;font-weight:normal;margin:1em 0em;}'+
		'.header h1{background-color:#B2D4F3;background-repeat:repeat-x;font-size:110% !important;font-family:Helvetica Neue,Arial,Helvetica,sans-serif;margin-bottom:0.2em;margin-top:0;padding:0.5em;-moz-border-radius:5px 5px 0px 0px;color:#333333;background-image:url("'+tabBgImage+'")}'+
	//	'.dialogBody h1{background-color:#7A7A7A;border-bottom:1px solid #333333;font-size:110%;font-family:Helvetica Neue,Arial,Helvetica,sans-serif;margin-bottom:0.2em;padding:0.5em;-moz-border-radius:5px 5px 0px 0px;color:#fff;}'+
		'.dialogHistory {border:1px inset #999999;margin:0 1em 1em;padding-bottom: 1em;max-height: 200px;overflow-y:auto;width:448px;padding-left:1em;}'+
		'.dialogHistory ul{margin-left:2em;}'+
		'.dialogHistory li{list-style-type:circle;}'+
		'.dialogFooter input{-moz-border-radius:3px;background:none no-repeat scroll 4px center #EEEEEE;border:1px outset #666666;cursor:pointer;float:right;margin-left:0.5em;padding:3px 5px 5px 20px;min-width:100px;font-size: 12px;}'+
		'.dialogFooter input:hover { background-color:#f9f9f9; }'+
		'.dialogContent {padding:0px 10px 0px 10px;}'+
		'.dialogMin {min-height:0px !important}'
	);
	
	
	// opent tour dilaog styles:
	
	GM_addStyle(
		"#dialogDetails {height:294px;padding:3px;overflow:auto;background-color:#eff4f9;border:1px solid #C0CEE3; -moz-border-radius: 0px 5px 5px 0px;width:324px;position: absolute; right: 10px;}\
		 .dialogList li{font-size:10px;padding:3px;clear:both;list-style-type: none;}\
		 .dialogList {margin:0;padding:0}\
		 .activeTour {border: 1px solid #C0CEE3;-moz-border-radius: 5px 0px 0px 5px;background-color:#eff4f9;padding:1px;}\
		 #dialogListContainer {height:300px;overflow:auto;width:150px;position: absolute; left: 10px;} \
		"
	);



	// add global styles

	var head =document.getElementsByTagName('head')[0];    
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML =
		'.cachelist li {'+
			'	-moz-border-radius-bottomright:10px;'+
				'	-moz-border-radius-topleft:10px;'+
				'	list-style-position:inside;'+
				'	color:#000000;'+
				'	margin:0.5em;'+
				'	padding:3px;'+
				'	width:120px;'+
				'	min-height:44px;'+
				'	-moz-background-clip:border;'+
				'	-moz-background-inline-policy:continuous;'+
				'	-moz-background-origin:padding;'+
				'	border:1pt dashed gray;'+
			//	'	background:#FFFFFF none repeat scroll 0 0;'+
				'	color:#000000;'+
				'}'+
				''+
				'.cachelist {'+
					'	font-size:80%;'+
						//~ '	list-style-type:disc;'+
						'	padding:0;'+
						'}';
	head.appendChild(style); 	

	
	
	
	// first filter blacklist
    // process "add to your GCTour"-link from gctour.madd.in    
	if(document.URL.search("webcode")>=0) {
		document.title = "GcTour";
		document.getElementsByTagName('body')[0].innerHTML = "<div align='center'><a href='http://www.geocaching.com'><img border='0' src='http://madd.in/icon.png'/></a></div>";
		downloadTourFunction(document.URL.split("webcode/")[1]);

		return;
	}
	
		
	
	
	// start sepcial script on send-to-gps page
	if(document.URL.search("http://www.geocaching.com/seek/sendtogps.aspx")>=0) {
		    	// show the GPX box, if the option is set
		if(GM_getValue('showGpx',false)){
			document.getElementById('dataString').parentNode.style.visibility = 'visible';
			document.getElementById('dataString').style.width = '100%';
		}


		// see, whether this windows is opened by the tour or by something else
		var qsParm = new Array();
		var query = window.location.search.substring(1);
		var parms = query.split('&');
		for (var i=0; i<parms.length; i++) {
			var pos = parms[i].indexOf('=');
			if (pos > 0) {
				var key = parms[i].substring(0,pos);
				var val = parms[i].substring(pos+1);
				qsParm[key] = val;
			}
		}


		if(qsParm['tour']){
			sendToGPS();
		} 
		
		return;
	}
	
	





	// update the complete gui if the tab gets focus
	window.addEventListener("focus", updateTour,false);
	
	window.addEventListener("resize", handleResize,false);
	
	
	//~ window.onresize = function(event) {
    //~ ...
//~ }


	
    // process autoTour
	if(GM_getValue('tq_url')){

		// iff the cancelbutton is presssed 
		if(GM_getValue("stopTask",false)){
			GM_deleteValue('tq_url');
			GM_deleteValue('tq_caches');
			GM_setValue('stopTask',false);
			document.location.href = GM_getValue('tq_StartUrl',"http://www.geocaching.com");
			return; // then return!
		}




		var tq_url = GM_getValue('tq_url');

		if(tq_url == document.location.href){
			
			addProgressbar({caption:lang['autoTourWait']});
			
			
			var tq_caches = eval(GM_getValue('tq_caches', new Array()));
			var tq_typeFilter = eval(GM_getValue('tq_typeFilter'));
			var tq_sizeFilter = eval(GM_getValue('tq_sizeFilter'));
			var tq_dFilter = eval(GM_getValue('tq_dFilter'));
			var tq_tFilter = eval(GM_getValue('tq_tFilter'));
			var tq_specialFilter = eval(GM_getValue('tq_specialFilter'));


					

			var pagesSpan = dojo.query("td[class='PageBuilderWidget']> span")[0];

			if(!pagesSpan){
				alert("no caches here :-( pagesSpan missing");
				GM_deleteValue('tq_url');
				GM_deleteValue('tq_caches');
				document.location.href = GM_getValue('tq_StartUrl',"http://www.geocaching.com");
				return;
			}

			setProgress(parseFloat(pagesSpan.getElementsByTagName('b')[1].innerHTML)-1,parseFloat(pagesSpan.getElementsByTagName('b')[2].innerHTML),document);

            // locate the table
            
            var images_array = dojo.query("img[id *= 'uxDTCacheTypeImage']");
            
            
            // find all dtsize images and extract the temporary code
            var dtImageQuery = "";
            for(var i = 0; i < images_array.length;i++){
				dtImageQuery += images_array[i].getAttribute('src').split("=")[1];;
				dtImageQuery = (i!=images_array.length-1)?dtImageQuery+"-":dtImageQuery;
			}
			
			// use the geocaching OCR in the google cloud to find difficulty,terrain and size										
			GM_xmlhttpRequest({
				method: 'GET',
				url: 'http://geocaching-ocr.appspot.com/geocachingocr?il='+dtImageQuery,
				onload: function(responseDetails) {
						if(typeof JSON === "undefined"){
							var dtsize_details = eval("("+responseDetails.responseText+")");
						} else {
							var dtsize_details = JSON.parse(responseDetails.responseText);
						}
						
						
						var resultTable = dojo.query("table[class = 'SearchResultsTable Table'] > tbody > tr");
						var j = 0;
						for(var i = 0; i < resultTable.length-1;i++){ // iterate over each cache 
						
								var entryTds = resultTable[i+1].getElementsByTagName('td');
								var entry = new Object(); // gather informations line-by-line
								
								
								
								dojo.query('span',entryTds[4])[1].textContent.search(/\|\s*GC(\S{3,9})\s*\|/)
								entry.id = "GC"+RegExp.$1;
								entry.name = trim(dojo.query('span',entryTds[4])[0].textContent);
								entry.guid = entryTds[4].getElementsByTagName('a')[0].href.split('guid=')[1];
								entry.image = entryTds[4].getElementsByTagName('img')[0].getAttribute('src').replace(/wpttypes\//, "WptTypes/sm/");
								entry.available = entryTds[4].getElementsByTagName('a')[1].getAttribute('class') == 'lnk  ';
								
								
								
								var type = entry.image.split("/")[6].split(".")[0];
								type = (type == "earthcache")?137:type;
								
								var size = dtsize_details[i].size;
								
								
								var difficulty = dtsize_details[i].difficulty;
								var terrain = dtsize_details[i].terrain;
										

								log(entry.id+" "+entry.name);
								log(type + " " + tq_typeFilter[type]);
								log(size + " " + tq_sizeFilter[size]);
								log(difficulty + " " + tq_dFilter[difficulty+""]);
								log(terrain + " " + tq_tFilter[terrain+""]);
								log("");

								// autoTour magic starts here 										
								// check whether the caches match against the given D/T values
								var addBool = tq_typeFilter[type] && tq_sizeFilter[size] && tq_dFilter[difficulty+""] && tq_tFilter[terrain+""];
								if(tq_specialFilter['is Active']){
									log("Check if "+entry.name+" is active:");
									log("available:"+entry.available);
									addBool = addBool && (entry.available);// only add if active!
								}
								
								if(tq_specialFilter['is not a PM cache']){
									log("Check if "+entry.name+" is PM-Only cache!!")
									log("PM:"+entryTds[5].innerHTML.indexOf('small_profile.gif') < 0);
									addBool = addBool && (entryTds[5].innerHTML.indexOf('small_profile.gif') < 0);
								}
								
								// autoTour parameter "haven't found" is not checked here because of URL parameter

								// if all parameters match - add the cache
								if(addBool){ 
									tq_caches.push(entry);
								}
						} // END for each cache
						
						GM_setValue('tq_caches',uneval(tq_caches));

						var gcComLinks = document.getElementsByTagName("a");
						var nextLink;
						for(var i = 0; i<gcComLinks.length;i++){
							if(gcComLinks[i].innerHTML == "<b>&gt;&gt;</b>"){
								nextLink = gcComLinks[i+1];
								break;
							}
						}

						// check if there are some caches on this page (next link is not there)
						if(!nextLink){
							alert("no caches here :-(");
							GM_deleteValue('tq_url');
							GM_deleteValue('tq_caches');
							document.location.href = GM_getValue('tq_StartUrl',"http://www.geocaching.com");
							return;
						}

						var action = nextLink.href.split("'")[1];
						if(action){
							var u = 500;
							var l = 2000;
							var waitingTime = Math.floor((Math.random() * (u-l+1))+l);
							// wait between 0.5 -> 2 seconds to do the next request
							window.setTimeout(function(){unsafeWindow.__doPostBack(action,'');},waitingTime);
						} else {

							currentTour = new Object();
							currentTour.id = getNewTourId();		
							currentTour.name = "autoTour "+currentTour.id;
							currentTour.geocaches =tq_caches;
							tours.push(currentTour);
							log("autoTour done - create new Tour: "+currentTour.id +" ; "+ currentTour.name);
							saveCurrentTour();

							document.location.href = GM_getValue('tq_StartUrl',"http://www.geocaching.com");
						}					
						
					} // end ONLOAD
			});
			return;
		} else {
			GM_deleteValue('tq_url');
			GM_deleteValue('tq_caches');
		}
	}
  




	// beta maps - map/beta/default.aspx
	if(document.URL.search("\/map\/beta\/default\.aspx")>=0) {
		
		//~ <div style="width:100px;margin-left:auto;margin-right:auto;background-color:#fff;padding:3px;-moz-border-radius:3px;border:2px solid #666"><img src=""></div>
		
		var autoTour_div = createElement('div',{
			style:'width: 100px; \
			margin-left: auto; \
			margin-right: auto; \
			border-radius: 5px; \
			background-color: #FFF; \
			border: 4px solid #999; \
			cursor: pointer;'
		});
		autoTour_div.className = "header";
		
		autoTour_div.innerHTML = "<h1><img src='"+mapToAutoTour+"'>";
		
		dojo.query("h1",autoTour_div).onmouseover(function(e){this.style.backgroundColor = "orange"}).onmouseout(function(e){this.style.backgroundColor = "#B2D4F3"}).onclick(function(e)
		{
			var googleMap = unsafeWindow.map;
			
			var bounds = googleMap.getBounds();
			var center = googleMap.getCenter();
			
			var radius = Math.floor(distanceBetween(center.lat(),center.lng(),bounds.getNorthEast().lat(),bounds.getNorthEast().lng() - (bounds.getNorthEast().lng() - bounds.getSouthWest().lng())/2)) / 1000;
			
			showAutoTourDialog(center,radius);
		});
			
		dojo.byId('maps-hd').appendChild(autoTour_div);

		
		var cacheDetailsTemplate = dojo.byId('cacheDetailsTemplate');
		cacheDetailsTemplate.innerHTML = cacheDetailsTemplate.innerHTML.replace(/<\/div>\s*{{else}}/g,'<br><a  class="lnk" href="javascript:add2tour();"><img src="'+addToTourImageString+'">&nbsp;<span>'+lang['addToTour']+'</span></a></div>{{else}}');	
		
		unsafeWindow.add2tour = function(){
			setTimeout(function() { 
				var gmCacheInfo = dojo.byId('gmCacheInfo');
				var links = dojo.query('a',gmCacheInfo);
				var images = dojo.query('img',gmCacheInfo);
				
				
				var gccode = dojo.query('div[class="code"]',gmCacheInfo)[0].textContent.trim();
				var name = links[0].textContent.trim();
				var cacheTypeImage = images[0].src.split('/')[6];
				var guid = links[links.length-2].href.split("guid=")[1];
				
				debug("beta maps add2tour: gccode:'"+gccode+"' name:'"+name+"' image:'"+cacheTypeImage+"' guid:'"+guid+"'");
				addElementFunction(gccode,guid,name,cacheTypeImage)();
			},0);
		};
		
		
	}

	// old maps
	var cacheListBody = document.getElementById('cacheListBody');
	if(cacheListBody){
		
		
		unsafeWindow.origUpdateSideBarList=unsafeWindow.updateSideBarList;
		unsafeWindow.updateSideBarList=gctourMapFunction;
		unsafeWindow.updateSideBarList();
		
		// also override the "build discription" function
		unsafeWindow.buildCDPage = gctourBuildCDPage;
		
		// and the parseCacheJSON function  - not used at the moment!
		//~ unsafeWindow.origParseCacheJSON = unsafeWindow.parseCacheJSON;
		//~ unsafeWindow.parseCacheJSON = gctourParseCacheJSON;
		//~ unsafeWindow.origCreateMarker = unsafeWindow.createMarker;
		//~ unsafeWindow.createMarker = gctourCreateMarker;
	}
	
	// add buttons to Bookmark site
	if(document.URL.search("\/bookmarks\/view\.aspx")>=0) {
		var bookmarkLines = dojo.query('tr[id*="row"]');
		
		for(var k = 0; k<bookmarkLines.length ; k++){
		    var bookmarkLine = dojo.query("td", bookmarkLines[k]);
            var entry = getEntryFromBookmarkTd(bookmarkLine);
            
			var addToTourButton = document.createElement('img');
			addToTourButton.alt = lang['addToTour'];
			addToTourButton.title = lang['addToTour'];
			addToTourButton.src = addToTourImageString;
			addToTourButton.style.cursor = 'pointer';
			addToTourButton.style.marginRight = '5px';

			addToTourButton.addEventListener('click', addElementFunction(entry.id,entry.guid,entry.name,entry.image), false);
			addHoverEffects(addToTourButton);
			bookmarkLine[4].appendChild(addToTourButton);   
		}
		
		
		
		
		
		// button to add all caches in list to current tour
		dojo.query('div[id="ctl00_ContentBody_ListInfo_uxAbuseReport"]')[0].innerHTML = lang['showCaches']
		
		var addBookmarkButton = createElement('button',{style:"margin:10px"});
		addBookmarkButton.setAttribute('onclick','return false;');
		addBookmarkButton.innerHTML ="<img src='"+addToTourImageString+"'/>&nbsp;"+lang['addShownBookmarks'];
		addBookmarkButton.addEventListener('click', function () {
					
		
					for(var k = 0; k<bookmarkLines.length ; k++){
						var bookmarkLine = dojo.query("td", bookmarkLines[k]);
						var entry = getEntryFromBookmarkTd(bookmarkLine);
			
						if(entry){
							addElementFunction(entry.id,entry.guid,entry.name,entry.image)();
							
						}
					};		
				},false);		
		dojo.query('div[id="ctl00_ContentBody_ListInfo_uxAbuseReport"]')[0].appendChild(addBookmarkButton);
		
		// button to add all caches in list to a new tour
		var newBookmarkButton = createElement('button',{style:"margin:10px"});
		newBookmarkButton.setAttribute('onclick','return false;');
		newBookmarkButton.innerHTML ="<img src='"+newImageString+"'/>&nbsp;+&nbsp;<img src='"+addToTourImageString+"'/>&nbsp;"+lang['addShownBookmarksToNewTour'];
		newBookmarkButton.addEventListener('click', function () {
					var listName = dojo.query('span[id="ctl00_ContentBody_lbHeading"]')[0].textContent;
					if(newTourFunction(listName)()){
						for(var k = 0; k<bookmarkLines.length ; k++){
							var bookmarkLine = dojo.query("td", bookmarkLines[k]);
							var entry = getEntryFromBookmarkTd(bookmarkLine);
				
							if(entry){
								addElementFunction(entry.id,entry.guid,entry.name,entry.image)();								
							}
						}
					}
				},false);		
		dojo.query('div[id="ctl00_ContentBody_ListInfo_uxAbuseReport"]')[0].appendChild(newBookmarkButton);	
		
		
		var newButton = document.createElement("input");
		newButton.name = 'addAll';
		newButton.type = 'submit';
		newButton.value = lang['addMarkedToTour'];
		newButton.id = 'addAll';	
		newButton.setAttribute('onclick','return false;');	
		newButton.style.cssFloat = 'right';

		// on click add checked caches in bookmark table
		newButton.addEventListener('click',  function(){
					for(var k = 0; k<bookmarkLines.length ; k++){
						var bookmarkLine = dojo.query("td", bookmarkLines[k]);
						var entry = getEntryFromBookmarkTd(bookmarkLine);
			
						if(entry){
							if(entry.checked){
							addElementFunction(entry.id,entry.guid,entry.name,entry.image)();
							}
						}
					};		
				}, false)
		//add the button to the website
		dojo.query('input[id="ctl00_ContentBody_ListInfo_btnDownload"]')[0].parentNode.appendChild(newButton);
	}


	// add the buttons to the search table
	//~ var searchResultTable = document.getElementById('ctl00_ContentBody_dlResults');
	//~ if(searchResultTable){		
	if(document.URL.search("\/seek\/nearest\.aspx")>=0) {	

		var entries = getEntriesFromSearchpage();
		
		for(var entry_i = 0; entry_i < entries.length; entry_i++){
			var entry = entries[entry_i];
			var addToTourButton = document.createElement('img');
			addToTourButton.alt = lang['addToTour'];
			addToTourButton.title = lang['addToTour'];
			addToTourButton.src = addToTourImageString;
			addToTourButton.style.cursor = 'pointer';
			addToTourButton.style.marginRight = '5px';


			addToTourButton.addEventListener('click', addElementFunction(entry.id,entry.guid,entry.name,entry.image), false);
		
			entry.position.appendChild(addToTourButton);
		}
		
		
		// add all checked to tour
		
		var newButton = document.createElement("input");
		newButton.type = 'submit';
		newButton.value = lang['addMarkedToTour'];
		newButton.setAttribute('onclick','return false;');	


		// on click add an element	
		newButton.addEventListener('click',  function(){
			var entries = getEntriesFromSearchpage();
		
			for(var entry_i = 0; entry_i < entries.length; entry_i++){
				var entry = entries[entry_i];
				if(entry.checked){
					addElementFunction(entry.id,entry.guid,entry.name,entry.image)();
				}
			}
		},false);
		
		var add_checked_tr = createElement('tr');
		add_checked_tr.innerHTML = "<td colspan=10></td>";
		
		append(newButton,add_checked_tr.firstChild);
		
		append(add_checked_tr,dojo.query('table[class = "SearchResultsTable Table"]')[0]);
		
		//~ 
		//~ var table = dojo.query('table[class = "SearchResultsTable Table"]')[0];
		//~ table.insertBefore(newButton,table.nextSibling);
	}	

	// dont display the list on the sendtogpx page
	if(document.URL.search("sendtogps\.aspx")<=0) {
		initComponents();

		// add the button to the details page
		if(document.URL.search("cache_details\.aspx")>=0) {
			initButton();
		}		

		//var loginLink = dojo.query('a[href="http://www.geocaching.com/my/"]')[0];
		
		//~ var loginLink = dojo.byId("ctl00_LoginUrl").previousSibling.previousSibling;
		//var loginLink = ("ctl00_LoginUrl").parentNode.getElementsByTagName('a')[0];
		
		
	
		var logInOutLink = dojo.byId('ctl00_hlSignOut') || dojo.byId('hlSignIn') || dojo.byId('uxLoginStatus_uxLoginURL') || dojo.byId('ctl00_ContentLogin_uxLoginStatus_uxLoginURL');// TODO - vllt ncoh mehr IDS? || dojo.byId('ctl00_ContentLogin_uxLoginStatus_uxLoginURL');
		var nameLink = logInOutLink.parentNode.getElementsByTagName('a')[0];

		// if logged in, Login_Name_Link will be the link to the username
		// if not logged in, Login_Name_Link will be the same as loginLogoutLink
		if (logInOutLink != nameLink) {
			userName = nameLink.textContent.trim();
		} 
			
	}


	// map to autotour button 
	var cacheListBounding = document.getElementById('cacheListBounding');
	if (cacheListBounding) {
		var autoTourDiv = createElement('div');
		autoTourDiv.align = 'center';
		autoTourDiv.style.padding = '10px';
		autoTourDiv.style.cursor = 'pointer';
		autoTourDiv.addEventListener('click',  function(e){
		
		        // get center of current viewport and pass it to autoTour
				var googleMap = unsafeWindow.map;
				var bounds = googleMap.getBounds();
				var center = googleMap.getCenter();
				var topCenter = unsafeWindow.GLatLng.fromUrlValue(bounds.getNorthEast().lat()+","+(bounds.getNorthEast().lng() - (bounds.getNorthEast().lng() - bounds.getSouthWest().lng())/2));
				
				var radius = Math.floor(topCenter.distanceFrom(center)) / 1000;

				showAutoTourDialog(center,radius);
				},false);
		addHoverEffects(autoTourDiv);

		var autoTourButton = createElement('img');
		autoTourButton.src=mapToAutoTour;


		append(autoTourButton,autoTourDiv);
		append(autoTourDiv,dojo.query('div[id="uxPremiumFeatures"]')[0]);

	}
}
