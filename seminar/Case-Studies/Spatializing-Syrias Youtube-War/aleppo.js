//Wednesday may 4
//Place map at Aleppo and get API token
(function() {
  

  // --------------------------------------------------------------------------------------------
  // Code magic starts here.

  function Neighborhood(featureData) {
    this.featureData = featureData;

    this.processFeatureData();
    this.manager = null;
    this.element = null;
  }

  Neighborhood.prototype.processFeatureData = function() {
    this.id = this.featureData.feature.id;
    this.data = this.featureData.feature.properties;
    this.name = this.data.NAME;
    this.arabicName = this.data.NAME_A;
    this.coordinates = this.featureData.feature.geometry.coordinates[0];
  };

  Neighborhood.prototype.setElement = function(element) {
    this.element = element;
    var _this = this;

    this.element.click(function(evt) {
      if (_this.manager) {
        _this.manager.toggleNeighborhoodVisibility(_this);
      }
    });
  };

  Neighborhood.prototype.setManager = function(manager) {
    this.manager = manager;
  };

  Neighborhood.prototype.isChecked = function() {
    // Grrr, depends on UI state. >_<
    if (this.element) {
      return this.element.is(':checked');
    }
  };


  function Keyword(english, arabic) {
    this.english = english;
    this.arabic = arabic;
    this.manager = null;
    this.element = null;
    this.active = false;
  }

  Keyword.prototype.setElement = function(element) {
    var _this = this;
    this.element = element;
    this.element.click(function(evt) {
      if (_this.manager) {
        _this.manager.toggleKeywordVisibility(_this);
      }
    });
  };

  Keyword.prototype.setManager = function(manager) {
    this.manager = manager;
  };

  Keyword.prototype.isChecked = function() {
    // Grrr, depends on UI state. >_<
    if (this.element) {
      return this.element.is(':checked');
    }
  };


  function Video(originalQuery, data, location, thumbnailUrl, videoId) {
    this.id = videoId;

    this.originalQuery = originalQuery;
    this.data = data;
    this.title = this.data.snippet.title;

    this.mapLocation = location;
    this.thumbnailUrl = thumbnailUrl;
    this.videoId = videoId;

    this.element = null;
  }

  Video.prototype.setElement = function(element) {
    this.element = element;
  };

  Video.prototype.show = function() {
    if (this.element) {
      this.element.show();
    }
  };

  Video.prototype.hide = function() {
    if (this.element) {
      this.element.hide();
    }
  };

  Video.prototype.hasKeyword = function(keyword) {
    return this.title.includes(keyword.arabic) || this.title.includes(keyword.english);
  };

  Video.prototype.inNeighborhood = function(neighborhood) {
    return this.title.includes(neighborhood.name) || this.title.includes(neighborhood.arabicName);
  };


  function FilterManager(neighborhoodsListElt, keywordsListElt) {
    this.neighborhoods = [];
    this.keywords = [];
    this.videos = [];

    this.neighborhoodsList = neighborhoodsListElt;
    this.keywordsList = keywordsListElt;
    this.redraw = null;
    this.map = null;
    this.neighborhoodsLayer = null;
  }

  FilterManager.prototype.addNeighborhood = function(neighborhood) {
    neighborhood.setManager(this);
    this.neighborhoods.push(neighborhood);

    var elt = $('<div class="neighborhood"><input type="checkbox" name="filters" value="' +
      neighborhood.name + '"> ' + neighborhood.name + '</div>');
    neighborhood.setElement($('input', elt));
    this.neighborhoodsList.append(elt);
  };

  FilterManager.prototype.toggleNeighborhoodVisibility = function(neighborhood) {
    var layers = this.neighborhoodsLayer.getLayers();
    var i = 0,
      numLayers = layers.length;

    for (; i < numLayers; i++) {
      var layer = layers[i];
      if (layer.feature.id === neighborhood.id) {
        layer.options.fill = !layer.options.fill;
        layer.options.stroke = !layer.options.stroke;
        break;
      }
    }

    if (this.redraw) {
      this.redraw();
    }

    this.filterVideos();
  };

  FilterManager.prototype.allKeywordsOff = function() {
    var tr = true;
    var i = 0,
      numKeywords = this.keywords.length;

    for (; i < numKeywords; i++) {
      var keyword = this.keywords[i];
      tr = tr && !keyword.isChecked();
    }

    return tr;
  };

  FilterManager.prototype.allNeighborhoodsOff = function() {
    var tr = true;
    var i = 0,
      numNeighborhoods = this.neighborhoods.length;

    for (; i < numNeighborhoods; i++) {
      var neighborhood = this.neighborhoods[i];
      tr = tr && !neighborhood.isChecked();
    }

    return tr;
  };

  FilterManager.prototype.toggleKeywordVisibility = function(keyword) {
    this.filterVideos();
  };

  FilterManager.prototype.filterVideos = function() {
    var i = 0,
      numVideos = this.videos.length,
      showAllKeywords = this.allKeywordsOff(),
      showAllNeighborhoods = this.allNeighborhoodsOff(),
      activeKeywords = [],
      activeNeighborhoods = [];

    var k2 = 0,
      numKeywords2 = this.keywords.length;

    for (; k2 < numKeywords2; k2++) {
      var keyword = this.keywords[k2];
      if (keyword.isChecked()) {
        activeKeywords.push(keyword);
      }
    } // end keyword loop (k)

    var n2 = 0,
      numNeighborhoods2 = this.neighborhoods.length;

    for (; n2 < numNeighborhoods2; n2++) {
      var neighborhood = this.neighborhoods[n2];
      if (neighborhood.isChecked()) {
        activeNeighborhoods.push(neighborhood);
      }
    }


    for (; i < numVideos; i++) {
      var video = this.videos[i];

      if (showAllKeywords && showAllNeighborhoods) {

        video.show();

      } else if (showAllKeywords && !showAllNeighborhoods) {

        var n = 0,
          numNeighborhoods = activeNeighborhoods.length,
          shouldShow = false;

        for (; n < numNeighborhoods; n++) {
          var neighborhood = activeNeighborhoods[n];

          if (video.inNeighborhood(neighborhood)) {
            shouldShow = true;
            break;
          }
        }

        if (shouldShow) {
          video.show();
        } else {
          video.hide();
        }

      } else if (!showAllKeywords && showAllNeighborhoods) {

        var k = 0,
          numKeywords = activeKeywords.length,
          shouldShow = false;

        for (; k < numKeywords; k++) {
          var keyword = activeKeywords[k];
          if (video.hasKeyword(keyword)) {
            shouldShow = true;
            break;
          }
        } // end keyword loop (k)

        if (shouldShow) {
          video.show();
        } else {
          video.hide();
        }
      } else {

        var n = 0,
          numNeighborhoods = activeNeighborhoods.length,
          k = 0,
          numKeywords = activeKeywords.length,
          shouldShow = false;

        for (; n < numNeighborhoods; n++) {
          var neighborhood = activeNeighborhoods[n];

          if (video.inNeighborhood(neighborhood)) {
            shouldShow = true;
            break;
          }
        }

        if (shouldShow) {
          shouldShow = false;
          for (; k < numKeywords; k++) {
            var keyword = activeKeywords[k];
            if (video.hasKeyword(keyword)) {
              shouldShow = true;
              break;
            }
          } // end keyword loop (k)
        }

        if (shouldShow) {
          video.show();
        } else {
          video.hide();
        }

      } // end showAllKeywords false

    } // end numVideos (i) loop
  };

  FilterManager.prototype.addKeyword = function(keyword) {
    keyword.setManager(this);
    this.keywords.push(keyword);

    var elt = $('<div class="neighborhood"><input type="checkbox" name="filters" value="' +
      keyword.arabic + '"> ' + keyword.english + '</div>');
    keyword.setElement($('input', elt));
    this.keywordsList.append(elt);
  }

  FilterManager.prototype.addVideo = function(originalQuery, data, location, thumbnailUrl,
    videoId) {
    var video = new Video(originalQuery, data, location, thumbnailUrl, videoId);
    this.videos.push(video);
    return video;
  };

  FilterManager.prototype.registerKeywords = function(keywordData) {
    for (var english in keywordData) {
      var arabic = keywordData[english];
      var keyword = new Keyword(english, arabic);
      this.addKeyword(keyword);
    }
  };

  FilterManager.prototype.setMap = function(map) {
    this.map = map;
  };

  FilterManager.prototype.getVideoById = function(id) {
    var i = 0,
      numVideos = this.videos.length;

    for (; i < numVideos; i++) {
      var video = this.videos[i];
      if (video.id === id) {
        return video;
      }
    }

    return null;
  };


  function AleppoMap(mapId, queries, options={}) {
    var keywordFiltersId = mapId + "-keyword-filters";
    var neighborhoodFiltersId = mapId + "-neighborhood-filters";
    var lightboxId = mapId + "-lightbox";

    var constants = {
      aleppoLocation: {
        lat: 36.198,
        lng: 37.1518
      },
      mapZoom: 13,
      accessToken: 'pk.eyJ1IjoibWljaGFlbGphbWVzc3Rvcm0iLCJhIjoiY2lrMWU2MTQ0M2EzeHdka2k1cTh5dXJreCJ9.YEng7E_ItjPExFDFnFTSQQ',


      //keyword search
      keywords: {
        'barrel bomb': 'برميل',
        'instance': 'لحظة',
        'sniper': 'قناص',
        'protests': 'مظاهر',
        'shelling': 'اقصف',
        'strangers': 'غرباء'
      },

      //neighborhood labels (following order in excel sheet - yellow in excel means entered here).
      queries: queries,

      mapboxMapId: 'violetwhitney.015226lm',
      mapboxStyle: 'mapbox://styles/mapbox/dark-v8',
      maxResults: options.maxResults || 8,
      numNeighborhoods:136
    };

    var init = function() {
      var i = 0,
      numQueries = constants.queries.length;

      for (; i < numQueries; i++) {
        var query = constants.queries[i];
        getYoutubeVideos(query.string, query.location);
      }
    };


    var neighborhoodsList = $('#' + neighborhoodFiltersId);
    var keywordsList = $('#' + keywordFiltersId);
    var manager = new FilterManager(neighborhoodsList, keywordsList);

    manager.registerKeywords(constants.keywords);


    L.mapbox.accessToken = constants.accessToken;
    var map = L.mapbox.map(mapId, 'mapbox.streets')
      .setView(constants.aleppoLocation, constants.mapZoom);
    manager.setMap(map);

    L.mapbox.styleLayer(constants.mapboxStyle).addTo(map);

    var tmp = {layerCount: 0};
    var neighborhoodsLayer = L.mapbox.featureLayer(constants.mapboxMapId).addTo(map);

      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.keyboard.disable();
      
    neighborhoodsLayer.on('layeradd', function(e) {
      var popupContent = '<strong>' + e.layer.feature.properties.title + '</strong>';
      e.layer.bindPopup(popupContent);

      var neighborhood = new Neighborhood(e.layer);
      manager.addNeighborhood(neighborhood);

      tmp.layerCount ++;
      if (tmp.layerCount === constants.numNeighborhoods) {
        init();
      }
    });

    manager.redraw = function() {
      map._onResize();
    };
    manager.neighborhoodsLayer = neighborhoodsLayer;


    var requestState = {
      numRequestsToMake: 0,
      numRequestsDone: 0,
      videoCache: {} // Map from location {lat:,lng:} to Video instance.
    };

    var placeImageOnMap = function(location, videoUrl, videoId) {
      var videoBounds = L.latLngBounds([
        [location.lat, location.lng],
        [location.lat + 1.0 / 400.0, location.lng + 1.5 / 400.0]
      ]);

      var image = L.imageOverlay(videoUrl, videoBounds).addTo(map);
      image.bringToFront();
      return image;
    };


    var showVideoLightbox = function(videoId) {
      var videoEmbedCode = '<iframe width="853" height="480" src="https://www.youtube.com/embed/' +
        videoId + '" frameborder="0" allowfullscreen></iframe>';
      $('#' + lightboxId + ' div.content').html(videoEmbedCode);

      $('#' + lightboxId).show();
      var left = $('#' + mapId).width() / 2.0 - $('#' + lightboxId).width() / 2.0;
      $('#' + lightboxId).css({
        left: left
      });

      $('#' + lightboxId + ' a.close-button').click(function(evt) {
        evt.preventDefault();
        $('#' + lightboxId).hide();
        return false;
      });
    };

    var createThumbnailsOnMap = function() {
      console.log(requestState.videoCache);
      for (var locationKey in requestState.videoCache) {
        var videos = requestState.videoCache[locationKey];

        var i = 0,
          numVideos = videos.length;

        for(; i < numVideos; i++) {
          var video = videos[i];
          var location = video.mapLocation;

          // Compute the location of this thumbnail.
          var closeness = 400.0; // The bigger this number, the smaller the thumbnails.
          var imageLocation = {
            lat: location.lat + Math.floor(i / 4) / closeness - 1.0 / closeness,
            lng: location.lng + 1.5 * ((i % 4) / closeness - 2.0 / closeness)
          };

          var image = placeImageOnMap(imageLocation, video.thumbnailUrl, video.videoId);
          var jqueryImage = $(image._image);
          jqueryImage.css({opacity:0.9});
          video.setElement(jqueryImage);
        } // end video loop
      } // end location loop
    };

    var registerImageClickHandlers = function() {
      $('#' + mapId + ' img.leaflet-image-layer').click(function(evt) {
        var src = evt.target.src;
        var pathComponents = src.split('/');
        var videoId = pathComponents[pathComponents.length - 2];
        showVideoLightbox(videoId);
      });
    };

    var onFinish = function() {
      createThumbnailsOnMap();
      registerImageClickHandlers();
      manager.filterVideos();
    };

    var checkForDone = function() {
      requestState.numRequestsDone += 1;

      if (requestState.numRequestsToMake > 0 && requestState.numRequestsToMake === requestState.numRequestsDone) {
        onFinish();
      }
    };

    var locationToKey = function(location) {
      return String(location.lat) + "," + String(location.lng);
    };

    var getYoutubeVideos = function(query, location) {
      requestState.numRequestsToMake += 1;

      var youtubeApiKey = "AIzaSyCp5aUBEFSWZIjOy7Q-OZA5A5PhLscZnN4";

      $.ajax({
        url: 'https://www.googleapis.com/youtube/v3/search',
        method: 'GET',
        headers: {},
        data: {
          'q': query,
          'key': youtubeApiKey,
          'part': 'snippet',
          maxResults: constants.maxResults
        },
        success: function(data) {

          for (var i = 0, len = data.items.length; i < len; i++) {
            var video = data.items[i];
            var thumbnail = video.snippet.thumbnails.medium.url;
              //should add in bit about opacity here
              //.setOpacity(0.7);

            var videoId = video.id.videoId;
            var video = manager.addVideo(query, video, location, thumbnail, videoId);

            // Cache the video at its location.
            var locationKey = locationToKey(location);
            if (!requestState.videoCache[locationKey]) {
              requestState.videoCache[locationKey] = [video];
            } else {
              requestState.videoCache[locationKey].push(video);
            }
          }

          checkForDone();
        },
        error: function(jqXHR) {
          checkForDone();
          console.error("Youtube query failed:", query);
        }
      });
    };

    
  } // End AleppoMap function



  window.onload = function() {
    var mainMapQueries = [
      {string: 'قلعة حلب حلب', //Aleppo Citadel 
      location: {lat:36.199083, lng:37.162843}
      }, {string: 'الفرافرة حلب', //al-Farafra 
      location: {lat:36.202293, lng:37.159624}
      }, {string: 'سوق المدينة حلب', //Souq al-Madina 
      location: {lat:36.197445, lng:37.159452}
      }, {string: 'البياضة حلب', //al-Bayyada 
      location: {lat:36.201784, lng:37.165546}
      }, {string: 'الأعجام حلب', //al-A'ajam 
      location: {lat:36.195758, lng:37.164345}
      }, {string: 'ألتونبوغا حلب', //Altunbogha 
      location: {lat:36.196728, lng:37.166448}
      }, {string: 'الضوضو حلب', //ad-Dudu 
      location: {lat:36.19457, lng:37.169935}
      }, {string: 'البلاط حلب', //al-Ballat 
      location: {lat:36.195592, lng:37.173024}
      }, {string: 'محمد بيك حلب', //Muhammad Bek 
      location: {lat:36.193784, lng:37.172756}
      }, {string: 'المشفى الوطني حلب', //The National Hospital 
      location: {lat:36.194657, lng:37.177713}
      }, {string: 'أبراج حلب', //Abraj 
      location: {lat:36.200862, lng:37.171453}
      }, {string: 'صاجليخان حلب', //Sajlikhan 
      location: {lat:36.198966, lng:37.176855}
      }, {string: 'القصيلة حلب', //al-Asileh 
      location: {lat:36.192849, lng:37.164817}
      }, {string: 'محمد بيك حلب', //Muhammad Bek 
      location: {lat:36.187087, lng:37.179}
      }, {string: 'الصالحين حلب', //as-Salheen 
      location: {lat:36.188692, lng:37.164001}
      }, {string: 'الفردوس حلب', //al-Fardos 
      location: {lat:36.187193, lng:37.150698}
      }, {string: 'باب المقام حلب', //Bab al-Maqam 
      location: {lat:36.187955, lng:37.156792}
      }, {string: 'ساحة بزة حلب', //Sahet Bizzeh 
      location: {lat:36.192164, lng:37.159387}
      }, {string: 'قلعة الشريف حلب', //Qal’et ash-Sharif 
      location: {lat:36.192699, lng:37.158163}
      }, {string: 'باب قنسرين حلب', //Bab Qinnasrin 
      location: {lat:36.193151, lng:37.153873}
      }, {string: 'الجلوم حلب', //aj-Jalloum 
      location: {lat:36.197445, lng:37.153873}
      }, {string: 'العقبة حلب', //al-‘Aqabeh 
      location: {lat:36.202442, lng:37.152801}
      }, {string: 'حديقة جمال حلب', //Jamal Abd an-Naser Park 
      location: {lat:36.198119, lng:37.150116}
      }, {string: 'الكلاسة حلب', //al-Kallaseh 
      location: {lat:36.191003, lng:37.149239}
      }, {string: 'بستان القصر حلب', //Bustan al-Qaser 
      location: {lat:36.187886, lng:37.143574}
      }, {string: 'بستان الزهرة حلب', //Bustan az-Zahra 
      location: {lat:36.192716, lng:37.141275}
      }, {string: 'المشارقة حلب', //al-Masharqa 
      location: {lat:36.198621, lng:37.137005}
      }, {string: 'الفيض حلب', //al-Feid 
      location: {lat:36.198361, lng:37.14179}
      }, {string: 'الجميلية حلب', //al-Jamiliyeh 
      location: {lat:36.204484, lng:37.144206}
      }, {string: 'الحديقة العامة حلب', //The Public Park 
      location: {lat:36.207479, lng:37.14707}
      }, {string: 'العزيزية حلب', //al-'Aziziyeh 
      location: {lat:36.204752, lng:37.156072}
      }, {string: 'العروبة حلب', //al-’Ourubeh 
      location: {lat:36.209719, lng:37.16151}
      }, {string: 'الحميدية حلب', //al-Hamidiyeh 
      location: {lat:36.210706, lng:37.162497}
      }, {string: 'بيت محب حلب', //Beit Muheb / Jdeydeh 
      location: {lat:36.202863, lng:37.16814}
      }, {string: 'قاضي عسكر حلب', //Qadi Askar 
      location: {lat:36.195971, lng:37.18241}
      }, {string: 'مقبرة كرز دادا حلب', //Karazdada Cemetery 
      location: {lat:36.196006, lng:37.180157}
      }, {string: 'الهزازة حلب', //al-Hazzazeh 
      location: {lat:36.206536, lng:37.159097}
      }, {string: 'قسطل المشط حلب', //Qastal Mosht 
      location: {lat:36.205662, lng:37.164774}
      }, {string: 'الشيخ طه حلب', //ash-Sheikh Taha 
      location: {lat:36.214482, lng:37.151384}
      }, {string: 'السليمانية حلب', //al-Suleimaniyeh 
      location: {lat:36.21065, lng:37.167816}
      }, {string: 'الميدان حلب', //al-Midan 
      location: {lat:36.220239, lng:37.167606}
      }, {string: 'تاتارلار حلب', //Tatarlar 
      location: {lat:36.20404, lng:37.181079}
      }, {string: 'مقبرة الشيخ يوسف حلب', //ash-Sheikh Yusef Cemetery 
      location: {lat:36.210031, lng:37.176316}
      }, {string: 'كرم الجبل حلب', //Karm aj-Jabal 
      location: {lat:36.206153, lng:37.182152}
      }, {string: 'قارلق حلب', //Qarleq 
      location: {lat:36.206049, lng:37.180221}
      }, {string: 'الدلالين حلب', //ad-Dallaleen 
      location: {lat:36.202707, lng:37.18241}
      }, {string: 'ابن يعقوب حلب', //Ibn Ya'aqoub 
      location: {lat:36.204103, lng:37.169729}
      }, {string: 'الجابرية حلب', //al-Jabriyeh 
      location: {lat:36.216535, lng:37.163229}
      }, {string: 'شيخ أبو بكر حلب', //Sheikh Abu Bakr 
      location: {lat:36.215501, lng:37.167993}
      }, {string: 'سليمان الحلبي حلب', //Suleiman al-Halabi 
      location: {lat:36.217529, lng:37.172327}
      }, {string: 'العرقوب حلب', //al-‘Arqoub 
      location: {lat:36.214067, lng:37.173958}
      }, {string: 'مقبرة ميسلون حلب', //Maysaloon Cemetery 
      location: {lat:36.210337, lng:37.16795}
      }, {string: 'مقبرة ميسلون حلب', //Maysaloon Cemetery 
      location: {lat:36.210337, lng:37.16795}
      }, {string: 'الألمجي حلب', //al-Almaji 
      location: {lat:36.20664, lng:37.166564}
      }, {string: 'أقيول حلب', //Aghyor 
      location: {lat:36.206683, lng:37.170566}
      }, {string: 'ثكنة هنانو حلب', //Hanano Barrack 
      location: {lat:36.2067, lng:37.169944}
      }, {string: 'السكري حلب', //as-Sukkari 
      location: {lat:36.167633, lng:37.160821}
      }, {string: 'كرم الدعدع حلب', //Karm ad-Da'ada'a 
      location: {lat:36.173769, lng:37.160931}
      }, {string: 'الصالحين حلب', //as-Salheen
      location: {lat:36.181095, lng:37.173741}
      }, {string: 'مقر الأنبياء حلب', //Maqar al-Anbiya'a 
      location: {lat:36.183226, lng:37.188246}
      }, {string: 'المرجة حلب', //al-Marjeh 
      location: {lat:36.17567, lng:37.186871}
      }, {string: 'شيخ سعيد حلب', //Sheikh Sa’eed 
      location: {lat:36.164468, lng:37.154989}
      }, {string: 'الراموسة حلب', //Ad-Ramouseh Industrial District I 
      location: {lat:36.159321, lng:37.120399}
      }, {string: 'تشرين حلب', //Tishreen 
      location: {lat:36.173041, lng:37.09877}
      }, {string: 'الحمدانية حلب', //al-Hamdaniyeh I 
      location: {lat:36.185946, lng:37.11791}
      }, {string: 'العامرية حلب', //al-‘Amiriyeh 
      location: {lat:36.170843, lng:37.125463}
      }, {string: 'أرض الصباغ حلب', //Ard As-Sabbagh 
      location: {lat:36.176802, lng:37.12409}
      }, {string: 'صلاح الدين حلب', //Salah ad-Deen 
      location: {lat:36.181998, lng:37.121944}
      }, {string: 'الأعظمية حلب', //al-A'azamiyeh 
      location: {lat:36.192112, lng:37.119799}
      }, {string: 'الأنصاري مشهد حلب', //al-Ansari Mashhad 
      location: {lat:36.176767, lng:37.135344}
      }, {string: 'تل الزرازير حلب', //Tal az-Zarazir 
      location: {lat:36.170497, lng:37.131472}
      }, {string: 'أنصاري شرقي حلب', //Ansari Sharqi 
      location: {lat:36.177737, lng:37.145869}
      }, {string: 'سيف الدولة حلب', //Sayf ad-Dauleh 
      location: {lat:36.191765, lng:37.127523}
      }, {string: 'الزبدية حلب', //az-Zebdiyeh 
      location: {lat:36.184864, lng:37.140805}
      }, {string: 'الأنصاري حلب', //al-Ansari 
      location: {lat:36.193878, lng:37.133616}
      }, {string: 'حلب الجديدة حلب', //New Aleppo 
      location: {lat:36.198257, lng:37.094479}
      }, {string: 'الشهداء حلب', //ash-Shuhada’ 
      location: {lat:36.203659, lng:37.104263}
      }, {string: 'الفرقان حلب', //al-Furqan 
      location: {lat:36.20264, lng:37.11937}
      }, {string: 'الغزالي حلب', //al-Ghazali 
      location: {lat:36.201324, lng:37.112331}
      }, {string: 'الكواكبي حلب', //al-Kawakbi 
      location: {lat:36.202216, lng:37.133402}
      }, {string: 'الشهداء حلب', //ash-Shuhada’ 
      location: {lat:36.200781, lng:37.126188}
      }, {string: 'الزهراء حلب', //az-Zahra’ 
      location: {lat:36.215048, lng:37.118893}
      }, {string: 'البلليرمون حلب', //al-Belleramoon 
      location: {lat:36.243918, lng:37.107353}
      }, {string: 'المحافظة حلب', //al-Muhafaza 
      location: {lat:36.200504, lng:37.15404}
      }, {string: 'جامعة حلب حلب', //University of Aleppo 
      location: {lat:36.210396, lng:37.115421}
      }, {string: 'الشهباء حلب', //ash-Shahba' 
      location: {lat:36.21746, lng:37.115507}
      }, {string: 'الأندلس حلب', //Andalus 
      location: {lat:36.221822, lng:37.116451}
      }, {string: 'السبيل حلب', //as-Sabil 
      location: {lat:36.214013, lng:37.13973}
      }, {string: 'شارع النيل حلب', //Nile Street 
      location: {lat:36.225354, lng:37.126236}
      }, {string: 'الخالدية حلب', //al-Khaldiyeh 
      location: {lat:36.229092, lng:37.118597}
      }, {string: 'السريان حلب', //as-Siryan (Syriac Quarter) 
      location: {lat:36.218083, lng:37.148981}
      }, {string: 'طارق بن زياد حلب', //Tareq Ben Ziad 
      location: {lat:36.219016, lng:37.144001}
      }, {string: 'الزهور حلب', //az-Zuhour 
      location: {lat:36.222041, lng:37.097054}
      }, {string: 'الرصافة حلب', //Rasafeh 
      location: {lat:36.234839, lng:37.130184}
      }, {string: 'السكن الشبابي حلب', //as-Sakan ash-Shababi 
      location: {lat:36.242108, lng:37.13954}
      }, {string: 'الشيخ مقصود حلب', //ash-Sheikh Maqsoud 
      location: {lat:36.2356, lng:37.153273}
      }, {string: 'الأشرفية حلب', //al-Ashrafiyeh 
      location: {lat:36.229369, lng:37.143574}
      }, {string: 'كرم حومد حلب', //Karm Homad 
      location: {lat:36.196198, lng:37.180052}
      }, {string: 'كرم القاطرجي حلب', //Karm al-Qaterji 
      location: {lat:36.201185, lng:37.180223}
      }, {string: 'كرم الميسر حلب', //Karm al-Myassar 
      location: {lat:36.196406, lng:37.18915}
      }, {string: 'ضهرة عواد حلب', //Dahret ‘Awwad 
      location: {lat:36.198292, lng:37.198997}
      }, {string: 'جورة عواد حلب', //Jouret ‘Awwad 
      location: {lat:36.20011, lng:37.200048}
      }, {string: 'الشعار حلب', //ash-Sha'ar 
      location: {lat:36.203763, lng:37.196937}
      }, {string: 'مطار حلب الدولي حلب', //Aleppo International Airport 
      location: {lat:36.183433, lng:37.221851}
      }, {string: 'النيرب حلب', //an-Nayrab 
      location: {lat:36.170824, lng:37.226658}
      }, {string: 'كرم الجزماتي حلب', //Karm aj-Jazmati 
      location: {lat:36.200216, lng:37.19799}
      }, {string: 'الحلوانية حلب', //al-Helwaniyeh 
      location: {lat:36.208804, lng:37.19739}
      }, {string: 'الصاخور حلب', //as-Sakhour I 
      location: {lat:36.215798, lng:37.181511}
      }, {string: 'بستان الباشا حلب', //Bustan al-Basha 
      location: {lat:36.226738, lng:37.167606}
      }, {string: 'تراب الهلك حلب', //Trab al-Hellok 
      location: {lat:36.235739, lng:37.172585}
      }, {string: 'عين التينة حلب', //Ayn at-Tal 
      location: {lat:36.241881, lng:37.173443}
      }, {string: 'الشيخ فارس حلب', //ash-Sheikh Fares 
      location: {lat:36.224988, lng:37.176189}
      }, {string: 'بعيدين حلب', //Ba'aiedeen 
      location: {lat:36.233989, lng:37.183228}
      }, {string: 'الحيدرية حلب', //al-Haydariyeh 
      location: {lat:36.237273, lng:37.193184}
      }, {string: 'هنانو حلب', //Hanano 
      location: {lat:36.227619, lng:37.202797}
      }, {string: 'شيخ خضر حلب', //Sheikh Kheder 
      location: {lat:36.224453, lng:37.183399}
      }, {string: 'الصاخور حلب', //as-Sakhour 
      location: {lat:36.218291, lng:37.189236}
      }, {string: ' حلب', //al-Besel 
      location: {lat:36.20823, lng:37.214813}
      }, {string: 'جبل بدرو حلب', //Jabal Badro 
      location: {lat:36.214324, lng:37.206745}
      }, {string: 'المعصرانية حلب', //al-Ma'asaraniyeh Youth Housing 
      location: {lat:36.201027, lng:37.208805}
      }, {string: 'جبرين حلب', //Industrial Area Jibreen 
      location: {lat:36.19036, lng:37.264595}
      }, {string: 'جبرين حلب', //Jibreen 
      location: {lat:36.178029, lng:37.256355}
      }];
    

    var channelQueries = [
{string: 'شبكة حلب نيوز::حلب القديمه ||سقوط برميل متفجر على مسجد بنقوسا والأضرار ماديه 6-8-2014', location: {lat:36.200862, lng:37.171453}
}, {string: 'حلب نيوز|| +18 اللحظات الأولى بعد سقوط برميل متفجر على حي الضوضو وصور الشهداء وآثار الدمار 13-8-2014', location: {lat:36.19457, lng:37.169935}
}, {string: 'مداخلة بهاء الحلبي مراسل حلب نيوز على أورينت والحديث عن تطورات المدينة الصناعية', location: {lat:36.150589, lng:37.14426}
}, {string: 'المدينة الصناعية : استمرار احتراق المعمل بعد انفجاره جراء سقوط قذيفة عليه', location: {lat:36.150589, lng:37.14426}
}, {string: 'لحظة سقوط البرميل المتفجر من الطائرة المروحي على المدينة الصناعية بحلب', location: {lat:36.150589, lng:37.14426}
}, {string: 'حلب نيوز: استهداف مدرسة المدفعية بالراموسة من قبل الفوج الأول 2015/5/23', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز || استهداف أماكن تمركز قوات النظام في كلية الراموسة من قبل لواء السلطان مراد 17-4-2015', location: {lat:36.150589, lng:37.14426}
}, {string: 'حلب نيوز::المجاهدون يستهدفون قوات النظام على جبهة الراموسه بمدفع موجه 29-3-2015', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز||غرفة مدفعية حلب إستهداف معاقل الجيش بقذائف الهاون المتمركزين داخل كازية الراموسة', location: {lat:36.150589, lng:37.14426}
}, {string: 'حلب نيوز || الراموسة - تحرر من بطش النظام وظلمه ولاكن لم ينفد بحياته بل ذهب شهيد في محاولة إنشقاقه', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز || تدمير مدفع طراز 57 للنظام على جبهة الراموسة بصاروخ مالوتكا 10-6-2014', location: {lat:36.150589, lng:37.14426}
}, {string: 'هام - حلب نيوز || الراموسة : تدمير دبابة داخل كتيبة المدفعية من قبل جيش المجاهدين 28 5 2014', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز - قصف نقاط تمركز قوات النظام في جبهة الراموسة 18 5 2014', location: {lat:36.150589, lng:37.14426}
}, {string: 'رصد أحد المباني العسكرية في الراموسة', location: {lat:36.150589, lng:37.14426}
}, {string: 'أشتباكات في منطقة الراموسة', location: {lat:36.150589, lng:37.14426}
}, {string: 'قصف على حي الراموسة 14 4 2014', location: {lat:36.150589, lng:37.14426}
}, {string: 'مميز اا كاميرا شبكة حلب نيوز ترصد مباني كلية التسليح في الراموسة 13 4 2014', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز اا غرفة عمليات أهل الشام تستهدف معاقل النظام في الراموسة بالهاون 12 4 2014', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز اا توجه المزيد من آليات الثوار إلى جبهة الراموسة 12 4 2014', location: {lat:36.150589, lng:37.14426}
}, {string: 'خاص - حلب نيوز || تقرير مصور عما حدث اليوم في منطقة الراموسة والسيطرة على مناطق جديدة 11 4 2014', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز || رصد اوستراد الراموسة ومنطقة ضاحية الأسد 4 7 2014', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز || الجبهة الإسلامية - جيش الاسلام : تستهدف مدفعية الراموسة بقذائف الهاون', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز :: دخان كثيف يتصاعد من منطقة الراموسة', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز رصد أماكن تمركز النظام في حي الراموسة21 8 2013', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز رصد اوتستراد الراموسة وحركة السيارات20 8 2013', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز :الراموسة || رصد مبنى قيادة مدفعية الراموسة', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز : رصد مدفعية الراموسة من بعيد', location: {lat:36.150589, lng:37.14426}
}, {string: 'غرفة عمليات العامرية والراموسة-دك مدرسة المدفعية بالراموسة بقذائف الهاون محلية الصنع', location: {lat:36.150589, lng:37.14426}
}, {string: 'شبكة حلب نيوز : آثار الدمار في حيي الجبيلة وأقيول في حلب القديمة أثر سقوط برميل متفجر15-4-2015', location: {lat:36.206683, lng:37.170566}
}, {string: 'الدفاع المدني يقوم بغسل الطرق في حي أقيول بعد الدمار الذي حل', location: {lat:36.206683, lng:37.170566}
}, {string: 'الاداره العامة للخدمات بتعاون مع مجلس حي اقيول تقوم باصلاح الكهرباء في االحي', location: {lat:36.206683, lng:37.170566}
}, {string: 'الاداره العامه للخدمات بتعاون مع مجلس حي اقيول تقوم باصلاح الكهرباء في الحي', location: {lat:36.206683, lng:37.170566}
}, {string: 'مجلس حي اقيول توزيع منظفات', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز - آثار الدمار نتيجة القصف على حي أقيول 13-1-2014', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز: إصابة رجل مسن في حي أقيول برصاص قناص ثكنة هنانو 17-11-', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز||حي اقيول -ازمة في مادة الخبز بسبب غلا اسعار الطحين||16-11-2013||', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز||حلب-حي اقيول - آثار الدمار نتيجة قصف الدبابات المتمركزة بثكنة هنانو||16-11-2013||', location: {lat:36.206683, lng:37.170566}
}, {string: 'حلب - أقيول : جانب من نشاط الطلاب أثناء الدوام المدرسي', location: {lat:36.206683, lng:37.170566}
}, {string: 'أقيول - تصاعد الدخان بعد استهداف الحي بقذيفة دبابة 30-10-2013', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز- دمار في أحد المنازل نتيجة القصف بالدبابات على حي أقيول27-10-2013', location: {lat:36.206683, lng:37.170566}
}, {string: 'أقيول- آثار الدمار على جامع أسامة بن زيد 27-10-2013', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز-مظاهرة ضمن احتفاليات الاطفال في عيد الاضحى المبارك في حي اقيول ج3||17-10=2013||', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز-مظاهرة ضمن احتفاليات الاطفال في عيد الاضحى المبارك في حي اقيول ج2||17-10=2013||', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز-مظاهرة ضمن احتفاليات الاطفال في عيد الاضحى المبارك في حي اقيول ج1||17-10=2013||', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز- الإدارة العامة للخدمات -تصليح شبكات الكهرباء في حي أقيول 7-10-2013', location: {lat:36.206683, lng:37.170566}
}, {string: 'حي أقيول - توزيع معونات منزلية لأهالي الحي 25 8 2013', location: {lat:36.206683, lng:37.170566}
}, {string: 'أقيول- احتراق أحد المنازل نتيجة استهدافه برصاص قناص النظام حارق 25 8 2013', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز :: ائتلاف شباب الثورة رش المبيدات الحشرية في حي أقيول 15 8 2013', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز :: أغنية "ساقط ساقط يا بشار" في مظاهرة حي أقيول', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز :: أغنية للثورة رائعة في مظاهرة حي أقيول حلب القديمة', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز :: أغنية "جهز حالك للإعدام" في مظاهرة حي أقيول حلب القديمة', location: {lat:36.206683, lng:37.170566}
}, {string: 'أقيول - إقامة صلاة العيد في جامع أسامة بن زيد في حي أقيول', location: {lat:36.206683, lng:37.170566}
}, {string: 'أقيول جزء من دعاء الشيخ في الخطبة بجامع أسامة بن زيد', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز - إقامة صلاة الجمعة في جامع أسمة بن زيد في حي أقيول9-8-2013', location: {lat:36.206683, lng:37.170566}
}, {string: 'أقيول || حديث رائع لأحد المجاهدين في صلاة الجمعة بجامع أسامة بن زيد بعد تأهيل الجامع 9-8-2013', location: {lat:36.206683, lng:37.170566}
}, {string: 'إعادة تأهيل جامع أسامة بن زيد بعد انقطاع طويل وتخدميه بمتطوعين في حي أقيول', location: {lat:36.206683, lng:37.170566}
}, {string: 'شبكة حلب نيوز|| لحظة سقوط قذيفة دبابة على حي اقيول||8-11-2013||', location: {lat:36.206683, lng:37.170566}
}, {string: 'أقيول- لحظة سقوط القذيفة على جامع أسامة بن زيد وتصاعد الدخان 27-10-2013', location: {lat:36.206683, lng:37.170566}
}, {string: 'حلب_نيوز : آثار الدمارفي حيّ الجلوم بحلب القديمة نتيجة قصفه بالبراميل المتفجرة مساء أمس 9-8-2015', location: {lat:36.197445, lng:37.153873}
}, {string: 'حلب نيوز::المجلس المحلي يقوم باصلاح خط الكهرباء بعد انقطاع اكثر من سنتين في منطقة الجلوم 18-7-2015', location: {lat:36.197445, lng:37.153873}
}, {string: 'شبكة حلب نيوز: آثار الدمار بالمنازل السكنية بعد سقوط برميل متفجر على حي الجلوم بحلب القديمة', location: {lat:36.197445, lng:37.153873}
}, {string: 'حلب نيوز - كتائب الخضراء | استهداف تجمعات قوات النظام في مبنى الأمن السياسي ومخفر العزيزية 27-6-2014', location: {lat:36.204752, lng:37.156072}
}, {string: 'شبكة حلب نيوز|| كتائب ثوار الشام إستهداف تجمع قوات النظام في حي العامرية 2015/5/12', location: {lat:36.170843, lng:37.125463}
}, {string: 'شبكة حلب نيوز : إستهداف قوات النظام بحي العامرية برشاشات الثقيلة', location: {lat:36.170843, lng:37.125463}
}, {string: 'شبكة حلب نيوز||غرفة مدفعية حلب إستهداف مباني بالعامرية تتحصن بها قوات النظام أدت لتدمير رشاش 12.7', location: {lat:36.170843, lng:37.125463}
}, {string: 'حلب نيوز| الجبهة الشّاميّة تُدمر مبنى للنّظام في حي العامريّة 18 1 2015', location: {lat:36.170843, lng:37.125463}
}, {string: 'حلب نيوز || العامرية - جيش المجاهدين : استهداف قوات النظام بمدفع جهنم 1 11 2014', location: {lat:36.170843, lng:37.125463}
}, {string: 'شبكة حلب نيوز|| غرفة مدفعية حلب إمطار قوات النظام وشبيحته بقذائف مدفع جهنم والهاون في جبهة العامرية', location: {lat:36.170843, lng:37.125463}
}, {string: 'حلب نيوز || العامرية - جيش المجاهدين : استهداف قوات النظام بمدفع جهنم 31 10 2014', location: {lat:36.170843, lng:37.125463}
}, {string: 'حلب نيوز || العامرية - جيش المجاهدين : اشتباكات عنيفة وضرب قنابل وألغام يدوية 31 10 2014', location: {lat:36.170843, lng:37.125463}
}, {string: 'حلب نيوز || العامرية : صاروخ الفيل لم ينفجر وأحد المقاتلين يشرح عنه 30 10 2014', location: {lat:36.170843, lng:37.125463}
}, {string: 'حلب نيوز || العامرية : رصد عناصر النظام واستهداف مقرهم بمدفع جهنم من قبل أهل الشام 28 5 2014', location: {lat:36.170843, lng:37.125463}
}, {string: 'حلب نيوز || العامرية : استهداف قناص متركز بإحدى الأبنية بقذيفة دبابة من قبل جيش المجاهدين 28 5 2014', location: {lat:36.170843, lng:37.125463}
}, {string: 'شبكة حلب نيوز || جانب من التمهيد بسلاح الثقيل على جبهة العامرية 12 4 2014', location: {lat:36.170843, lng:37.125463}
}, {string: 'شبكة حلب نيوز اا تصاعد الدخان جراء سقوط برميل متفجر على حي العامرية 12 4 2014', location: {lat:36.170843, lng:37.125463}
}, {string: 'شبكة حلب نيوز حجم الدمار الكبير في حي العامرية 21 8 2013', location: {lat:36.170843, lng:37.125463}
}, {string: 'شبكة حلب نيوز حي العامرية رصد مباني تمركز النظام في الحي21 8 2013', location: {lat:36.170843, lng:37.125463}
}, {string: 'مميز اا جيش المجاهدين اا لحظة سقوط قذيفة من مدفع جهنم على قوات النظام بالعامرية وتناثر العناصر', location: {lat:36.170843, lng:37.125463}
}, {string: 'شبكة حلب نيوز - حي العامرية :: اللحظات الأولى للقصف على الحي 2-2-2014', location: {lat:36.170843, lng:37.125463}
}, {string: 'شبكة حلب نيوز || باب إنطاكية جيش المجاهدين يستهدف أماكن تمركز قوات النظام بفرع المرور وما حوله', location: {lat:36.202442, lng:37.152801}
}, {string: 'شبكة حلب نيوز::جيش المجاهدين يستهدف معاقل النظام بصواريخ محلبه في حي العرقوب 17-4-2014', location: {lat:36.214067, lng:37.173958}
}, {string: 'شبكة حلب نيوز:"حركة النهضة والعدالة " تقوم بإستهداف غرفة العمليات الجيش النظامي في حي العرقوب', location: {lat:36.214067, lng:37.173958}
}, {string: 'شبكة حلب نيوز - تصاعد الأدخنة من ثكنة هنانو وحي العرقوب 27-10-2013', location: {lat:36.214067, lng:37.173958}
}, {string: 'شبكة حلب نيوز - قصف ثكنة هنانو والعرقوب 27-10-2013', location: {lat:36.214067, lng:37.173958}
}, {string: 'هام اا شبكة حلب نيوز اا حاجز المستودعات في حي الأعظمية بحلب 23 3 2014', location: {lat:36.192112, lng:37.119799}
}, {string: 'حلب - صلاح الدين || أشتباكات عند نزلة الملعب بإتجاه الأعظمية 9-10-2013', location: {lat:36.192112, lng:37.119799}
}, {string: 'شبكة حلب نيوز :: جولة ميدانية داخل حي الأعظمية الخاضع لقوات النظام', location: {lat:36.192112, lng:37.119799}
}, {string: 'جزء من اشتباكات حي قسطل الحرامي عصر اليوم 5- 12- 2013', location: {lat:36.20664, lng:37.166564}
}, {string: 'مداخلة مراسل الشبكة على قناة الأورينت للحديث عن المجزرة التي ارتكبها طيران النظام في حيّ الأنصاري', location: {lat:36.193878, lng:37.133616}
}, {string: 'حلب || رصد البراميل المتفجرة على أحياء الأنصاري والسكري اليوم 12-4-2014', location: {lat:36.193878, lng:37.133616}
}, {string: 'شبكة حلب نيوز اا الدمار الناتج عن استهداف الطيران الحربي لحي الأنصاري', location: {lat:36.193878, lng:37.133616}
}, {string: 'شبكة حلب نيوز || آثار القصف بالطيران الحربي على ضيعة الأنصاري في حلب 23-12-2013', location: {lat:36.193878, lng:37.133616}
}, {string: 'الأنصاري : مظاهرة طلابية للبنات في مدرسة عين جالوت ضمن معرض لم ننسى - خافوا الله يا عرب 5 11 2013', location: {lat:36.193878, lng:37.133616}
}, {string: 'الأنصاري : مظاهرة طلابية للبنات في مدرسة عين جالوت ضمن معرض لم ننسى - يلعن روحك 5 11 2013', location: {lat:36.193878, lng:37.133616}
}, {string: 'شبكة حلب نيوز | أثار قصف طيران قوات النظام على حي المشهد صباح اليوم 12-4-2015', location: {lat:36.176767, lng:37.135344}
}, {string: 'شبكة حلب نيوز : إزالة الأنقاض في حي المشهد بعد قصف الحي بصاروخ 21-3-2015', location: {lat:36.176767, lng:37.135344}
}, {string: 'شبكة حلب نيوز: حي المشهد : نشوب حريق ضخم في الحي بعد سقوط صاروخ من نوع فيل 20-3-2015', location: {lat:36.176767, lng:37.135344}
}, {string: 'شبكة حلب نيوز : رسالة إلى المسيئين للرسول الكريم من مظاهرة حيي المشهد وصلاح الدين 16-1-2015', location: {lat:36.176767, lng:37.135344}
}, {string: 'شبكة حلب نيوز - حي المشهد :: آثار قصف قوات النظام الحي بالبراميل المتفجرة 9-2-2014', location: {lat:36.176767, lng:37.135344}
}, {string: 'حلب - المشهد || احتراق سيارة في حي المشهد نتيجة القصف بعد منتصف الليل 28-12-2013', location: {lat:36.176767, lng:37.135344}
}, {string: 'حلب - المشهد || مظاهرة في جمعة "الحصـار إبادة مستمرة" ج2 1-11-2013', location: {lat:36.176767, lng:37.135344}
}, {string: 'حلب - المشهد || مظاهرة في جمعة "الحصـار إبادة مستمرة" و حيّـت الكتائب الإسلامية 1-11-2013', location: {lat:36.176767, lng:37.135344}
}, {string: 'حلب - حي المشهد مظاهرة في الحي حيت الجيش الحر 27-9-2013', location: {lat:36.176767, lng:37.135344}
}, {string: 'حي المشهد"اجتماع مظاهرة حي مشهد وحي صلاح الدين', location: {lat:36.176767, lng:37.135344}
}, {string: 'المشهد "اثار القصف المدفعي على حي المشهد 18_9_2013', location: {lat:36.176767, lng:37.135344}
}, {string: 'حلب-المشهد || خروج مظاهرة من جامع علي بن ابي طالب حيت الدولة الاسلامية وطالبة بإقامة الخلافة', location: {lat:36.176767, lng:37.135344}
}, {string: 'حلب-المشهد || حرائر حلب يقومون بحرق علم حزب الله 23-8-2013', location: {lat:36.176767, lng:37.135344}
}, {string: 'حلب-المشهد || خروج من جامع علي بن أبي طالب تدعو للجهاد والثار لشهداء الغوطة 23-8-2013', location: {lat:36.176767, lng:37.135344}
}, {string: 'حلب-المشهد || خروج مظاهرة تندد بمجزرة ريف ديمشق 21-8-2013', location: {lat:36.176767, lng:37.135344}
}, {string: 'حلب - المشهد || صلاة الغائب على شهداء الغوطة بدمشق 21-8-2013', location: {lat:36.176767, lng:37.135344}
}, {string: 'هام | شبكة حلب نيوز : لحظة إنقاذ الجرحى من نساء وأطفال بعد قصف حي المشهد ببرميل متفجر', location: {lat:36.176767, lng:37.135344}
}, {string: 'الاشرفية || 9 6 2014 || مكان وقوع البرميل واثار الدمار وكلمة لقائد لواء الشهيد عبد القادر الصالح .', location: {lat:36.229369, lng:37.143574}
}, {string: 'الاشرفية ||7 6 2014 || الضرر الذي لحق المباني السكنية بالحي نتيجة القصف ببرميل متفجر.', location: {lat:36.229369, lng:37.143574}
}, {string: 'الاشرفية ||7 6 2014 || الضرر الذي لحق المباني السكنية بالحي نتيجة القصف ببرميل متفجر .', location: {lat:36.229369, lng:37.143574}
}, {string: 'الاشرفية || 4 6 2014 || تدمير احد اخطر الابنية بالحي ونسفها بالكامل بمدفع جهنم وقتل من فية .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب || الاشرفية 1 6 2014 || اثار االدمار بالمنازل السكنية اثر استهدافها بالبراميل المتفجر .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب الاشرفية || 20-5-2014 || اثار الدمار بالحي نتيجة سقوط صاورخ ارض ارض .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز || 18-5-2014 || اسعاف الاطفال المصابين اثر قصف بالبراميل المتفجرة على الاشرفية .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز || الاشرفية 11-5-2014 || سحب جثة احد الضحايا بالبرميل الغدر صباح اليوم .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز || الأشرفية8 5 2014 || اثار الدمار الذي نتج عن البرميل الذي سقط بالاشرفية السكن الشبابي .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز || الأشرفية3 5 2014 || الدمار الذي حصل باحد ابنية السكن الشبابي نتيجة قصف الاحتلال الاسدي .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز|| الأشرفية3 5 2014 || كلمة من احد المصابين لملك السعودية خاصة والمسلمين عامة .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز : الأشرفية : كلمة من احد المصابين لملك السعودية خاصة والمسلمين عامة 3-5-2014', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز : الأشرفية : آثار الدمار في السكن الشبابي نتيجة قصف قوات النظام للمنطقة 3-5-2014', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز ||الاشرفية 2 4 2014 ||استهداف الطيران بالصواريخ الفراغية المباني السكنية بالسكن الشبابي ج1.', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز ||الاشرفية 2 4 2014 || اسعاف المدنين', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز ||الاشرفية 2 4 2014 ||استهداف الطيران بالصواريخ الفراغية المباني السكنية بالسكن الشبابي ج2.', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز || الاشرفية 2 4 2014 || محاولة اسعاف الشهيد عمار دباغ الذي استهدف الطيران سيارتة .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز || الاشرفية 17 4 2014 || احدى طائرات الاسد وهي ترمي البراميل على احياء حلب المحررة.', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز ||الاشرفية 17 4 2014 || معالجة المصابين بقذائف الكوفزديكا التي سقطت على الحي .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز || الاشرفية 17 4 2014 || كلمة لاحد المصابين بقذئف الاسد((كوفزديكا))', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز || الاشرفية 17 4 2014 || القذائف وهي تتساقط على حي الاشرفية .', location: {lat:36.229369, lng:37.143574}
}, {string: 'حلب نيوز:: الادارة العامة للخدمات تقوم بإصلاح خط المياه في حي الاصيلة 20-8-2015', location: {lat:36.192849, lng:37.164817}
}, {string: 'حلب نيوز | استخراج رجل مسن من تحت أنقاض منزله في حيّ القصيلة نتيجة قصفه ببرميل متفجر 2-8-2015', location: {lat:36.192849, lng:37.164817}
}, {string: 'حلب نيوز || الأصيلة : الدفاع المدني يقوم بإطفاء الحريق الناجم عن القصف 14 9 2014', location: {lat:36.192849, lng:37.164817}
}, {string: 'حلب نيوز || آثار الدمار إثر سقوط صاروخ أرض - أرض على حي الأصيلة بعد منتصف الليل 19-8-2014', location: {lat:36.192849, lng:37.164817}
}, {string: 'شبكة #حلب_نيوز | جولة مصوّرة لكاميرا الشبكة في حيّ البلاط بحلب القديمة', location: {lat:36.195592, lng:37.173024}
}, {string: 'حلب نيوز::انتشال الشهداء من تحت الانقاض نتيجة سقوط برميل متفجر على حي البلاط20-5-2015', location: {lat:36.195592, lng:37.173024}
}, {string: 'حلب نيوز:: أب يبكي عائلته التي فقدها نتيجة سقوط برميل متفجر على حي البلاط 20-5-2015', location: {lat:36.195592, lng:37.173024}
}, {string: 'حلب نيوز::اثار الدمار نتيجة سقوط برميل متفجر على حي البلاط وشهادة الدفاع المدني20-5-2015.', location: {lat:36.195592, lng:37.173024}
}, {string: 'شبكة حلب نيوز - هام للإعلام - جولة لرصد قصف الطيران الحربي لمنطقة البلاط في حي قاضي عسكر 10-12-2013', location: {lat:36.195592, lng:37.173024}
}, {string: 'حلب نيوز||هام:استخراج طفل من بين الانقاض نتيجة سقوط صاروخ فيل في حي البياضة 25-8-2015', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز:دماربين منازل المدنيين في حي باب الحديد بعد القاء الطيران المروحي برميل متفجر12-7-2015', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز : حي جب القبة آثار الدمار في الحي بعد سقوط برميل متفجر ادى الى اضرار مادية5-7-2015', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز:حلب القديمة باب الحديد دمارهائل بين منازل المدنيين بعدسقوط برميل متفجر 11-6-2015', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز | أثناء محاولة الدفاع المدني من إنقاذ المدنين تحت الأنقاض بحي باب الحديد 2015-4-18', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز | لقطات تظهر إنتشال الأشلاء من القصف على حي جب القبة +18', location: {lat:36.201784, lng:37.165546}
}, {string: 'حلب نيوز - حي البياضه || آثار القصف الصاروخي على مسجد الحي من قبل قوات النظام 2-1-2015', location: {lat:36.201784, lng:37.165546}
}, {string: 'حلب نيوز || آثار الدمار في حيّ البياضة بحلب القديمة نتيجة قصف الحيّ بصواريخ أرض - أرض 2-1-2015', location: {lat:36.201784, lng:37.165546}
}, {string: 'حلب نيوز::الأداره العامه للخدمات تصلاح الكهرباء بعد انقطاع دام 3 ايام في حي الجبيله 8-12-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز||باب الحديد:إخماد حريق في إحدى المنازل جراء استهدافه من قبل قناص القلعة 13-11-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز::حي البياضه قصف بالبلراميل المتفجره على الحي والأضرار ماديه 30-9-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز::باب الحديد ||شهداء وجرحى جراء سقوط برميلين على الحي 1-8-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز:حي البياضة|| آثار الدمار في منازل المدنيين بعد القصف بالبراميل على الحي 25-7-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز: حي باب الحديد|| اثار الدمار في الحي واستشهاد شخص بعد القصف بالبراميل 25-7-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز - قصف بالطيران الحربي على حي جب القبة 13-6-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب: نيوز:باب الحديد ::حي "الماوردي" اثار الدمار بعد القصف بالبراميل على الحي3-6-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز::باب الحديد ||جوله لكاميرة حلب نيوز في حي باب الحديد 3-6-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز:باب الحديد ::اثار الدمار في احد الجوامع في الحي 3-6-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز - أحد البراميل التي سقطت على حي باب النصر ولم تنفجر 19-4-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز - سقوط برميل متفجر على ساحة الألمجي في حي باب النصر 19-4-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز - آثار الدمار جراء سقوط برميل على حي باب النصر 19-4-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز - آثار الدمار في حي باب النصر 19-4-2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز||حي باب الحديد-معانات أهالي الحي جراء انقطاع المياه ||10-4-2014||', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز||حي البياضة-آثار الدمار جراء القصف بالطيران الحربي||23-3-2014||', location: {lat:36.201784, lng:37.165546}
}, {string: 'حلب نيوز || باب النصر : مظاهرة ثورية في جمعة ثورتنا شعبية وليست حرب أهلية 14 3 2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز اا وصول مظاهرة حلب القديمة إلى دوار باب الحديد 28 2 2014', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز||آثار الدمار جراء سقوط برميل متفجر على حارة الباشا في حي باب الحديد||10-12-2013||', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز||اثار الدمار الناتج عن سقوط قذفتين قرب دوار باب الحديد||11-11-2013||', location: {lat:36.201784, lng:37.165546}
}, {string: 'حلب - احدى الحلات الانسانية المؤلمة : طفل فقد رجليه بقصف قوات النظام على حي باب الحديد', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز - قصف تعرض له حي باب النصر 12-10-2013', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز :: عنصر من كتيبة أحرار باب الحديد يتهم بشكل مباشر كتيبة أحرار جبرين بالسرقة', location: {lat:36.201784, lng:37.165546}
}, {string: 'باب الحديد - آثار الدمار الذي تعرضت له حارة العريان 6-10-2013', location: {lat:36.201784, lng:37.165546}
}, {string: 'مجلس ثوار حلب القديمة - مظاهرة لأحرار حي جب القبة 27-9-2013', location: {lat:36.201784, lng:37.165546}
}, {string: 'حلب القديمة مظاهرة في حي البياضة في جمعة وما النصر إلا من عند الله 30 8 2013', location: {lat:36.201784, lng:37.165546}
}, {string: 'حلب القديمة مظاهرة لأحرار حي البياضة 30 8 2013', location: {lat:36.201784, lng:37.165546}
}, {string: 'حلب القديمة -حي البياضة -مظاهرة في جمعة الارهابي بشار يقتل المدنيين بالكيماوي 23-8-2013', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز مظاهرة غاضبة في حي جب القبة تنديدا بمجزرة الغوطة 22 8 2013', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز جب القبة مظاهرة في الحي تنديدا بمجزرة الغوطة 22 8 2013', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز مظاهرة في حي جب القبة 22 8 2013', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز|| لحظة سقوط قذفتين على دوار قرب دوار باب الحديد| |11-11-2013||', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة حلب نيوز -لحظة التقاء مظاهرتي قاضي عسكر والبياضة بحلب القديمة 23-8-2013', location: {lat:36.201784, lng:37.165546}
}, {string: 'شبكة #حلب_نيوز|| تقرير: معركة تحرير #الليرمون وفتح طريق إمداد لحلب', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز|| تقرير: معركة تحرير الليرمون وفتح طريق إمداد لحلب', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز ||الليرمون 9 4 2014 || الطيران الحربي والمروحي يلقي البراميل على حي الليرمون .', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز || رصد دوار الليرمون و المباني المحيطة به بعد تحريرها 23-3-2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'هام اا شبكة حلب نيوز اا وصول المجاهدين إلى دوار الليرمون الطريق المؤدي إليه 23 3 2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز:تصوير يظهر لنا الجيش الحر في المدخل الرئيسي للقصر العدلي 19-3-2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز :كلمه لأحد مجاهدي وعلماء مدينة حلب داخل القصر العدلي 19-3-2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز :الجيش الحلر يقوم بحرق صور بشار من داخل القصر العدلي 19-3-2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'حلب نيوز || القصر العدلي : اشتباكات عنيفة بكافة أنواع الأسلحة مع قوات النظام 18 3 2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'حلب نيوز || القصر العدلي : دك مبنى القصر العدلي من قبل الثوار بالدبابات 18 3 2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز||غرفة عمليات اهل الشام- استهداف القصر العدلي بقذائف الهاون||18-3-2014||', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز||غرفة عمليات اهل الشام-قصف مبنى القصر العدلي بالدبابات||18-3-2014||', location: {lat:36.243918, lng:37.107353}
}, {string: 'هام اا شبكة حلب نيوز اا اعترافات عسكري من قوات النظام بعد أسره من أمام القصر العدلي 25 2 2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز اا اشتباكات في صد محاولة تسلل قوات النظام من القصر العدلي 23 2 2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز اا مشاركة كبار السن من المجاهدين وأصحاب الإحتياجات في صد التسلل من القصر العدلي 23 2 2', location: {lat:36.243918, lng:37.107353}
}, {string: 'هام اا شبكة حلب نيوز اا اشتباكات عنيفة في محيط القصر العدلي أثناء صد تسلل قوات النظام 23 2 2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز اا رسالة من أحد المجاهدين الرابطين على جبهة القصر العدلي 8 2 2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز اا آثار الدمار الذي حل بالقصر العدلي بعد التفجير 8 2 2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز:اللحظات الأولى لدخول الى القصر العدلي بعد تأمينهي بكامل19-3-2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'هاااااام - حلب نيوز || القصر العدلي : لحظة التفجير التمهيدي أمام القصر العدلي وبدء المعركة 18 3 2014', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز||غرفة عمليات اهل الشام-لحظة تفجير القصر العدلي||18-3-2014||', location: {lat:36.243918, lng:37.107353}
}, {string: 'شبكة حلب نيوز:حلب القديمة اثار الدمار في جامع العثمانية 3-6-2014', location: {lat:36.202293, lng:37.159624}
}, {string: 'حلب نيوز || أهالي حيّ الفرودس يقومون بحفر الآبار في الحيّ لاستخراج المياه الجوفية 19-8-2015', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب نيوز::جولة في حي الفردوس ترصد اثار الدمار نتيجة سقوط براميل متفجرة في الحي 19-8-2015', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب نيوز::اهالي حي الفردوس يناشدون المجلس المحلي بمدينة حلب ترحيل الانقاض وفتح الطرقات', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب نيوز - الفردوس || آثار الدمار نتيجة استهداف الحي بالبراميل المتفجرة 30-5-2015', location: {lat:36.187193, lng:37.150698}
}, {string: 'مداخلة مراسل شبكة حلب نيوز بهاء الحلبي للحديث عن مجزرة جسر الحج التي ارتكبتها قوات الأسد 2015/5/12', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب نيوز | 11-5-2015 | الادارة العامة للخدمات تقوم باصلاح خط الكهرباء 66KV المغذي لمحطة جسر الحج', location: {lat:36.187193, lng:37.150698}
}, {string: 'شِبكة حلب نيوز | الفردوس | 14-4-2015 | اثار الدمار اثر الغارة الجوية على الحي', location: {lat:36.187193, lng:37.150698}
}, {string: 'لواء السلطان مراد يستهدف تجمعات النظام في مبنى الفردوس بمدفع (ب9)وتدمير رشاش لقوات النظام 5-4-2015', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز || اثار الدمار في حي الفردوس بعد سقوط برميل متفجرعلى مباني سكنية', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز:: خروج مظاهرة في حي الفردوس طالبت بخلافة إسلامية 2014-12-19', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز : حي الفردوس : ترحيل مخلّفات القصف على الحي من قبل المجلس المحلي 8-12-2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز : حي الفردوس : ترحيل مخلّفات القصف من قبل المجلس المحلي 8-12-2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز : ترحيل القمامة المتراكمة بشكل دوري في منطقة جسر الحج من قبل المجلس المحلي 27-11-2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز:تقريرعن حملة إزالة القمامة من مكب جسر الحج إلى خارج المدينة لتجنب من الأمراض المتفشية', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز::الدفاع المدني يخرج طفل وأمراه في حي الفردوس جراء احتراق مجالات وقود 19-11-2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز : الإدارة العامة للخدمات تقوم بتصليح شبكة مياه رئيسية عند دوار جسر الحج بحلب', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز- جسر الحج||الدفاع المدني يحاول إخراج أطفال من تحت الأنقاض 16-9-2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز::جسر الحج||شهداء وجرحى جراء قصف بالبراميل المتفجره على الحي 16-9-2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب نيوز | إنقطاع المياه عن منطقة جسر الحج نتيجة إنفجار خط المياه بعد استهدافه ببرميل 15-9-2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - الفردوس || آثار الدمار الذي حل بعد سقوط برميل متفجر من طائرات قوات النظام 25-4-2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب نيوز اا استخراج الأطفال والنساء من تحت أنقاض القصف بالبراميل على حي الفردوس 20 4 2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز اا أحد المدنيين يروي ما حدث في حي الفردوس 4 2 2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'هام اا شبكة حلب نيوز اا رسالة إلى معارضة الخارج داخل مسجد الفردوس بعد القصف 3 2 2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'هاام - شبكة حلب نيوز :: تراكم الأوساخ في مكب دوار جسر الحج بشكل كبير 30-1-2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز اا تراكم الأوساخ بشكل كبير في مكب دوار جسر الحج', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز اا آثار القصف على كراج دوار جسر الحج', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز اا آثار القصف بالطيران الحربي على دوار جسر الحج وعملية إجلاء الضحايا', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز||حي جسر الحج-آثار الدمار جراء القصف بالطيران الحربي قرب مبنى البريد', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز||حي جسر الحج- تراكم اطنان من القمامة في الحي في ظل غياب الجهات الخدمية', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب -الفردوس: مدرسة الوليد ابن عبدالملك -أحد الدروس العلمية في المدرسة', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - الفردوس || نشوب حريق في مولدة كهربائية نتيجة الضغط الزائد 5-11-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - الفردوس : معهد النهضة لتحفيظ القرآن الكريم ج2', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب -الفردوس : معهد النهضة لتحفيظ القرآن الكريم', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - جسر الحج || الإدارة الإسلاميَّة للخدمات تقوم بترحيل مكب جسر الحج 24-10-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'الأدارة الأسلامية"تقوم بأصلاح الطرق وتمهيد الطرق بحي الفردوس', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز:المجلس المحلي بالتعاون مع الإدارة الإسلامية يقومون بترحيل القمامة من جسر الحج', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز :: جمعية عطاء الثورة تقوم بتوزيع الحصص الإغاثية في حي الفردوس', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز :: دوار جسر الحج اصبح اكبر تجمع لرمي القمامة', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز :: الإدارة الإسلامية للخدمات تقوم بإصلاح الصرف الصحي في حي الفردوس', location: {lat:36.187193, lng:37.150698}
}, {string: 'برومو مجزرة الفردوس 27\8\2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - الفردوس || استمرار انتشال الجثث من تحت الأنقاض ج2 27-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - الفردوس || استمرار انتشال الجثث من تحت الأنقاض ج1 27-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب نيوز : هام - التعليق على مجزرة الفردوس بعد وقوعها بقليل - من قلب الحدث', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - الفردوس || قصف مكان استهداف الطائرة بالدبابات على الحي 26-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - الفردوس || يتسائل أين عائلتي بكل هل قتلو أم هم تحت الركام أم فروا بحياتهم 26-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - جسر الحج || سقوط القذائف مكان استهداف الطائرة 26-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - الفردوس || تصاعد أعمدة الدخان عقب استهداف الحي بصاروخ طائرة حربية 26-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - الفردوس || انقاذ امرأة من تحت الأنقاض خلف القصف الجوي الذي طاله الحي 26-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب-جسر الحج || انقاذ امرأة من تحت الانقاض واسعافها 26-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'هام حلب-جسر الحج || سحب الجثث من تحت الانقاض 26-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'مؤثر : طفلة من حي الفردوس تتحدث عن العيد', location: {lat:36.187193, lng:37.150698}
}, {string: 'جولة ميدانية في المركز الإغاثي في حي الفردوس 8-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز | لحظة سقوط قذيفة دبابة على مكان إنتشال الشهداء والجرحى من مجزرة جسر الحج', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز ..حي الفردوس || اللحظات الأولى للقصف على الحي ودمار أكثر من اربع مباني 13-7-2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب نيوز اا لحظات بعد القصف بالبراميل المتفجرة على حي الفردوس وانتشال الأشلاء 20 4 2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز||جسر الحج:اللحظات الاولى للقصف ببرميل متفجر وخوف وهلع في صفوف المدنيين', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز اا لحظات بعد القصف على حي الفردوس بالبراميل المتفجرة 3 2 2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب نيوز || جسر الحج : لحظة القصف بالبراميل المتفجرة قرب الجسر 18 1 2014', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب - الفردوس || لحظات قليلة بعد سقوط الصاروخ على الحي 26-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'حلب-جسر الحج || لحظة سقوط الصاروخ على الحي 26-8-2013', location: {lat:36.187193, lng:37.150698}
}, {string: 'شبكة حلب نيوز || بيان قائد كتيبة سعد بن ابي وقاص حول حاجز ملعب الحمدانية 1-9-2013', location: {lat:36.178534, lng:37.113361}
}, {string: 'حلب-الحمدانية || الجيش الحر يرصد بقناصاته ملعب الحمدانية 1-9-2013', location: {lat:36.178534, lng:37.113361}
}, {string: 'حلب-صلاح الدين || قصف حاجز ملعب الحمدانية بلهاون 120 1-9-2013', location: {lat:36.178534, lng:37.113361}
}, {string: 'شبكة حلب نيوز- كتائب الخضراء|| استهداف تجمعات قوات النظام في منطقة ميسلون بمدفع جهنم5-8-2014', location: {lat:36.210706, lng:37.162497}
}, {string: 'حلب نيوز::اثار الدمار وكلمة لنساء التركمان نتيجة سقوط برميل متفجر على حي الحيدرية 27-6-2015', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز؛؛انتشال الشهداء من تحت الانقاض نتيجة سقوط برميل متفجر على حي الحيدرية +18 27-6-2015', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز - حيّ الحيدرية || سقوط شهداء نتيجة استهدف الحيّ بالبراميل المتفجره 4-2-2015', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز::حي الحيدريه::قصف بالبراميل على الحي والاضرار ماديه 2-2-2015', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز : جولة في حي "الحيدرية" في مدينة حلب عن الأوضاع المعيشية والخدمية في الحي 24-11-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : انقاذ الجرحى وحالة الذعر بعد سقوط البرميل الأول على الحي 2 10 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز::حي الحيدريه ||جرحى ودمار كبير جراء سقوط برميل على الحي ج (2) 2-10-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز::حي الحيدريه ||قصف بالبراميل المتفجره على الحي والأضرار ماديه 1-10-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : قصف بالبراميل المتفجرة على الحي 1 10 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : الدمار الناتج عن قصف الدوار بالبراميل المتفجرة 5 9 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز - حي الحيدرية || احتراق منزل نتيجة إستهداف الحي ببرميل متفجر 1-8-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز ::شهداء وجرحى جراء قصف جوي على حي الحيدريه 23-7-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : كلمة من أحد المدنيين بعد استهداف الحي بصاروخ حربي 15 7 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : اثار الدمار في مدرسة زيد بن حارثة نتيجة سقوط برميل متفجر 4 7 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز : استهداف سيارة في حي الحيدرية بقذيفة صباح اليوم 1 - 7 - 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز : قصف بالبراميل المتفجرة على حي الحيدرية 23 - 6 - 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز || الحيدرية : قصف على الحي بالبراميل المتفجرة 18 - 6 - 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : اسعاف جريح واثار الدمار الناتج عن برميلين متفجرين سقط على الحي 11 6 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : أحد المدنيين يتكلم عن القصف ويتحدى بشار الأسد 10 6 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : آثار الدمار الناتج عن القصف بالبراميل المتفجرة 10 6 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : آثار الدمار الناتح عن القصف بالبراميل 7 6 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز ::مروحيات النظام تلقي برميل على حي الحيدريه ولم ينفجر 25-5-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز ::سقوط عدد من الجرحى ودمار كبيرنتيجة سقوط برميلين في حي الحيدريه 25-5-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : نشوب حرائق في بعض المعامل بعد القصف بالبراميل في الليلة الماضية 24 5 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : الدمار الذي بالحي نتيجة القصف بالبراميل 23 5 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'إسعاف جرحى القصف على دوار الحيدرية 13-5-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : آثار الدمار الناتج عن القصف بالبراميل على الحي 26 6 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : طفل يتكلم عما حدث ويقارن بين حال أهالي المناطق المحررة والمحتلة 17 4 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : آثار القصف بالبراميل المتفجرة على الحي 17 4 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز اا الدمار الذي خلفه برميل الموت على دوار الحيدرية اليوم 9 / 6 / 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : شهداء المجزرة وآثار الدمار وسقوط البرميل أثناء الانقاذ 9 3 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : آثار الدمار الذي حل بالحي نتيجة القصف بالبراميل المتفجرة 19 2 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || جبل الحيدرية : آثار الدمار الذي حلّ بالحي نتيجة القصف بالطيران الحربي 11 2 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'إسعاف جرحى القصف بالبرميل الرابع على حي الحيدرية 9/2/2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'لقطات من القصف الذي تعرض له دوار الحيدرية بالبراميل المتفجرة 9/2/2014 +18', location: {lat:36.237273, lng:37.193184}
}, {string: 'الصور الأولى للمجزرة التي أرتكيتها قوات النظام بالقصف بالبراميل على دوار الحيدرية 9/2/2014 +18', location: {lat:36.237273, lng:37.193184}
}, {string: 'مؤثر || جبل الحيدرية : أب يصرخ لابنته الشهيدة بنتي رح تعيش ولقطات من مكان القصف 3 2 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : آثار القصف بالبراميل المتفجرة على الحي وسقوط شهيد 22 12 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : كلام مؤثر من أحد المدنيين ومناشدة الأهالي 15 12 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : آثار القصف المروحي الذي أدى لسقوط العشرات من الشهداء 15 12 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : أحد المدنيين يتكلم عن الحادثة التي قضى فيها العشرات من الشهداء 15 12 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : إخراج المصاحف من بين الركام واستمرار عمليات البحث 14 12 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : جزء من الدمار الحاصل في الحي نتيجة سقوط البراميل المتفجرة 14 12 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : بكاء الأطفال وهروبهم مع أمهاتهم وسط فوضى 14 12 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : هروب العائلات بعد سقوط البرميل الثاني 14 12 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : إسعاف أمرأة بعد إجلاءها من تحت الأنقاض وسط هلع كبير 14 12 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : الأهالي يشتكون من غياب تام للخدمات المدنية من الحي 9 11 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : إصلاح الكهرباء من قبل الأهالي بمعدات بسيطة 9 11 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : انتشال القتلى ومحاولة اطفاء الحريق الناتج عن القصف 9 11 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز - تصاعد الدخان قرب دوار الحيدرية نتيجة سقوط قذيفة هاون على محل لبيع الوقود 9-11-2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز :: الإدرة الإسلامية للخدمات تقوم بتجهيز كراج للسرافيس في حي الحيدرية', location: {lat:36.237273, lng:37.193184}
}, {string: 'كتيبة "الشهيد نورس" تنفي تلقيها أتاوات من أصحاب المحال التجارية في الحيدرية', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب - الحيدرية || تراكم القمامة التي تسبب لانتشار الأوبئة بين الأطفال 5 9 2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب-الحيدرية || انتشار تلوث البيئة بسبب غياب الرقابة 31-8-2013', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز لحظة سقوط برميل متفجر على حي الحيدرية 2015/02/10', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز::حي الحيدريه ::اللحظات الأولى من القصف على حي الحيدرية 5--2-2015', location: {lat:36.237273, lng:37.193184}
}, {string: 'هام - حلب نيوز | لحظة سقوط برميل متفجر على حيّ الحيدرية اليوم 24-10-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : أولى الللحظات لسقوط البرميل الثاني على الحي 2 10 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : لحظة رمي البرميل المتفجر من المروحية حتى سقوطه على الحي 9 9 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نيوز حي الحيدريه اللحظات الاولى من القصف وفريق الأسعاف يقوم بنقل المصابين وشهداء 5-9-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'هام جدا - حلب نيوز || الحيدرية : لحظة سقوط برميل متفجر من المروحية على الحي 23 5 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'شبكة حلب نبوز || لحظة استهداف حي الحيدرية ببرميلين متفجرين 16 - 5 - 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'لحظة سقوط برميل متفجر على حي الحيدرية ج1 13-5-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'لحظة سقوط برميل متفجر على حي الحيدرية ج2 13-5-2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : لحظة القصف بالبراميل وإطفاء الحرائق الناتجة إثر القصف 26 4 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : لحظة القصف على الحي وآثار الدمار وكلمة من أحد المدنيين 23 4 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : لحظة القصف على الحي بالطيران الحربي 20 3 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : لحظة القصف بالبراميل وآثار الدمار الذي حل بالحي 23 2 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'لحظة سقوط برميلين متفجرين على حي الحيدرية وتصاعد أعمدة الدخان 12/2/2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز || الحيدرية : اللحظات الأولى للقصف على الحي بالبراميل المتفجرة وانتشال الضحايا 12 2 2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'لحظة قصف الطيران الحربي المسعفين في حي الحيدرية وتصاعد أعمدة الدخان 11/2/2014', location: {lat:36.237273, lng:37.193184}
}, {string: 'حلب نيوز||هاام ومؤثر-الحيدرية :لحظات بعد سقوط البرميل الأول وسقوط الثاني أثناء التصوير وهلع السكان', location: {lat:36.237273, lng:37.193184}
}, {string: 'هام اا شبكة حلب نيوز اا لحظة القصف على منطقة دوار الحلوانية بالبراميل المتفجرة 2 2 2014', location: {lat:36.208804, lng:37.19739}
}, {string: 'شبكة حلب نيوز::كتيبة الهاون الخضراء تستهدف قوات النظام في حي الجابريه بصواريخ محلية الصنع 21-5-2014', location: {lat:36.216535, lng:37.163229}
}, {string: 'شبكة حلب نيوز: حركة النور الإسلامية قامت بإستهدف القصر البلدي بالمدفع B9 والرشاشات الثقيلة5-4-2015', location: {lat:36.204484, lng:37.144206}
}, {string: 'شبكة حلب نيوز: الجبهة الشامية|أشتباكات بين الثوار وقوات النظام المتمركزة في القصر البلدي 28-2-2015', location: {lat:36.204484, lng:37.144206}
}, {string: 'حلب نيوز::جيش المجاهدين يستهدف معاقل النظام في القصر البلدي بمدفع جهنم 7-12-2014', location: {lat:36.204484, lng:37.144206}
}, {string: 'شبكة حلب نيوز ::جيش المجاهدين يسقط قناص النظام في القصر البلدي أثر استهدفي بقذائف الدبابه 25-10-2014', location: {lat:36.204484, lng:37.144206}
}, {string: 'شبكة حلب نيوز حي الكلاسه |أحتراق محال لبيع المحروقات جراء استهدافه من قبل قناص القصر البلدي 8-9-2014', location: {lat:36.204484, lng:37.144206}
}, {string: 'شبكة حلب نيوز||جيش المجاهدين يقوم بااستهداف قناص القصر البلدي بمدفع ب9', location: {lat:36.204484, lng:37.144206}
}, {string: 'شبكة حلب نيوز| جيش المجاهدين استهداف مبنى القصر البلدي التي تتمركز فيه قناصات قوات النظام 12 3 2014', location: {lat:36.204484, lng:37.144206}
}, {string: 'حلب - القصر البلدي || على يد أحد مقاتليه كتيبة أسود الأسلام يسقط عنصر من قوات النظام 27-10-2013', location: {lat:36.204484, lng:37.144206}
}, {string: 'حلب - الثوار يستهدفون القصر البلدي بقذائئف الهاون مصباح يوم السبت 17-8-2013', location: {lat:36.204484, lng:37.144206}
}, {string: 'شبكة حلب نيوز :: إستهدف حواجز الشبيحة في محيط قصر البلدي وفندق الأمير 14-8-2013', location: {lat:36.204484, lng:37.144206}
}, {string: 'هام اا حلب نيوز اا لحظة سقوط قذيفة هاون على الحاجز المجاور للقصر البلدي 3-4-2014', location: {lat:36.204484, lng:37.144206}
}, {string: 'حلب نيوز || عمال المجلس المحلي في مدينة حلب يقومون بإصلاح شبكة الصرف الصحي في حيّ الكلاسة 18-8-2015', location: {lat:36.191003, lng:37.149239}
}, {string: 'حلب نيوز::اثار الدمار نتيجة سقوط صاروخ من الطيران الحربي على حي الكلاسة 18-8-2015', location: {lat:36.191003, lng:37.149239}
}, {string: 'شبكة حلب نيوز | إنتشال الشهداء والجرحى في حي الكلاسة بعد الغارة الثانية 2015-4-17', location: {lat:36.191003, lng:37.149239}
}, {string: 'شبكة حلب نيوز | انتشال الشهداء والجرحى في حي الكلاسة بعد سقوط برميل مفتجر 2015-4-17', location: {lat:36.191003, lng:37.149239}
}, {string: 'حلب نيوز || الكلاسة : آثار الدمار الناتج عن سقوط صاروخ أرض أرض 13 11 2014', location: {lat:36.191003, lng:37.149239}
}, {string: 'شبكة حلب نيوز :: حي الكلاسه ||كلمه للدفاع المدني عن سبب الحريق 8-9-2014', location: {lat:36.191003, lng:37.149239}
}, {string: 'مميز - شبكة حلب نيوز || بستان القصر والكلاسة تعلو فيها تكبيرات عيد الفطر 1 شوال 28-7-2014', location: {lat:36.191003, lng:37.149239}
}, {string: 'الكلاسة - آثار الدمار نتيجة سقوط برميل على الحي فجر الخميس 6-5-2014', location: {lat:36.191003, lng:37.149239}
}, {string: 'الكلاسة جامع الصبحان بعد استهدافه ببرميل متفجر وكلمة لأمة المليار ونصف 3 6 2014', location: {lat:36.191003, lng:37.149239}
}, {string: 'حلب - الكلاسة - عمليات اإنتشال الجثث من تحت الأنقاض 17 5 2014', location: {lat:36.191003, lng:37.149239}
}, {string: 'هام اا شبكة حلب نيوز اا أب يكلم طفله العالق تحت أنقاض القصف بالطيران على حي الكلاسة 26 2 2014', location: {lat:36.191003, lng:37.149239}
}, {string: 'هام اا شبكة حلب نيوز اا استخراج أشلاء جثة من تحت أنقاض القصف بالطيران الحربي على حي الكلاسة 26 2 20', location: {lat:36.191003, lng:37.149239}
}, {string: 'هام اا شبكة حلب نيوز اا محاولة استخراج الجثث من تحت أنقاض القصف بالطيران الحربي على حي الكلاسة 26 2', location: {lat:36.191003, lng:37.149239}
}, {string: 'شبكة حلب نيوز - مشرع أضاحي لجمعية فسحة أمل في حي الكلاسة 15-10-2013', location: {lat:36.191003, lng:37.149239}
}, {string: 'شبكة حلب نيوز -حي الكلاسة - طقوس الأضاحي بمناسبة عيد الأضحى المبارك15-10-2013', location: {lat:36.191003, lng:37.149239}
}, {string: 'حلب - الكلاسة || ضحايا ومصابين ودمار لحظة سقوط البرميل من الطيران المروحي 27 4 2014', location: {lat:36.191003, lng:37.149239}
}, {string: 'هام : لحظة سقوط برميل متفجر على حي الكلاسة وحالة هلع بين المدنيين وانتشال الجثث 18 4 2014', location: {lat:36.191003, lng:37.149239}
}, {string: 'هام اا شبكة حلب نيوز اا لحظة القصف بالطيران الحربي على حي الكلاسة 26 2 2014', location: {lat:36.191003, lng:37.149239}
}, {string: 'شبكة حلب نيوز||حي الكلاسة- لحظات مابعد القصف بالبراميل المتفجرة على الحي ج2', location: {lat:36.191003, lng:37.149239}
}, {string: 'شبكة حلب نيوز||حي الكلاسة-لحظات مابعد القصف بالبراميل المتفجرة على الحي ج1', location: {lat:36.191003, lng:37.149239}
}, {string: 'شبكة حلب نيوز اا لحظات بعد القصف على حي الكلاسة وإجلاء الضحايا من تحت الركام', location: {lat:36.191003, lng:37.149239}
}, {string: 'حلب نيوز : قوات النظام تدمر منطقة المعامل في حي الخالدية بعد سيطرة الثوار عليها 2015/6/24', location: {lat:36.229092, lng:37.118597}
}, {string: 'حلب ||25 5 2014 || رصد عناصر النظام بالخالدية وهي تسرق الاغراض المنزلية .', location: {lat:36.229092, lng:37.118597}
}, {string: 'حلب نيوز :لواء السلطان مراد يستهدف تجمعات النظام بمدفع 160 على جبهة كرم الطراب 30-4-2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'حلب نيوز::لواء السلطان مراد يستهدف بقذائف محلية الصنع تجمعات النظام في كرم الطراب 29-4-2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'حلب نيوز-لواء السلطان مراد || استهداف أماكن تمركز قوات النظام في كرم الطراب بقذائف "جهنم" 22-4-2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'حلب نيوز::لواء السلطان مراد استهداف قوات النظام برشاشات الثقيله على جبهة كرم الطراب 16-4-2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز ||استهداف أماكن تمركز قوات النظام في كرم الطراب من قبل لواء السلطان مراد15 4 2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'لواء السلطان مراد كتائب أحفاد حمزه استهداف دشم النظام برشاشات الثقيله على جبهة كرم الطراب 11-4-2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'لواء السلطان مراد كتائب احفاد حمزه استهداف النظام بمدفع جهنم على جبهة كرم الطراب 11-4-2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'لواء السلطان مراد :فيلق الشام ::جانب من الأشتباكات التى خاضه الثوار على جبهة كرم الطراب 5-4-2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'لواء السلطان مراد :اشتباكات عنيفه على جبهة كرم الطراب ومطار النيرب العسكري باسلحه الثقيله5-4-2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'لواء السلطان مراد ::استهداف قوات النظام بصواريخ محليه ومدافع حهنم على جبهة كرم الطراب 5-4-2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'لواء السلطان مراد يستهدف تجمعات قوات النظام على جبهة كرم الطراب بمدافع جهنم 5-4-2015', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز ::كرم الطراب أحتراق معامل الحي جراء قصف بالبراميل المتفجره من الطيران المروحي 7-9-2014', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز::حي المعصرانيه ||المجلس المحلي يقوم بتوزيع سلل غذايه على الحي 17-7-2014', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكةحلب نيوز:لجنة حي المعصرانيه تقوم بتوزيع الأغاثه غلى أهالي الحي 24-4-2014', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز::سقوط اكثر من برميل على حي المعصرانيه خلف أضرار كبيره في المباني 23-4-2014', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز:أحد سكان حي المعصرانيه يتحدث عن القصف 23-4-2014', location: {lat:36.201027, lng:37.208805}
}, {string: 'حلب نيوز :لجنة حي المعصرانية الجديدة تقوم بتوزيع الحليب على اطفال اهالي الحي 30-3-2014', location: {lat:36.201027, lng:37.208805}
}, {string: 'حلب نيوز:مجلس حي المعصرانيه الجديد يقوم بتوذيع أغاثة من جمعية ASUبتعون مع المجلس المحلي 30-3-2014', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز لجنة حي المعصرانيه الجديده تقوم بأعادة تخديم الحي 26 3 2014', location: {lat:36.201027, lng:37.208805}
}, {string: 'هام اا شبكة حلب نيوز اا جولة لكاميرا حلب نيوز برفقة مدنيين في منطقة السكن الشبابي في حي المعصرانية', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز || قصف بالبرميل المتفجرة على حي المعصرانية 12-2-2014', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز|| حي المعصرانية-آثار الدمار جراء القصف بالطيران المروحي ببرميل متفجر', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز :: قصف بالبراميل المتفجرة على حي كرم الطراب 22-11-2013', location: {lat:36.201027, lng:37.208805}
}, {string: 'تقرير حلب نيوز :: عن نزوح أهالي منطقة المعصرانية والدعوة للعودة إليها 21-11-2013', location: {lat:36.201027, lng:37.208805}
}, {string: 'حلب - كرم الطرّاب || منذ أكثر من عشرة أشهر لايوجد ماء وذلك بلسان أحد سكان الحي 10-11-2013', location: {lat:36.201027, lng:37.208805}
}, {string: 'حلب نيوز: أشلاء لضحايا القصف على حي كرم الطراب يوم الجمعة 8-11-2013', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز كلمة :: مديرة مدرسة حي المعصرانية في كلمة عن النواقص في المواد الدراسية', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز :: احد الاشخاص من سكان حي كرم الطراب يتكلم عن نقص المياه الشديد', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز : حي المعصرانية || بسبب إنقطاع المياة الأطفال يقومون بنقل المياه الى المنازل', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز ::بيان || مدير مدرسة حي المعصرانية يصرح عن بدء العام الدراسي والحاجة الملحة للمدرسين', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز : حي المعصرانية || سقوط قذيفة على مستوصف العيادات الشاملة', location: {lat:36.201027, lng:37.208805}
}, {string: 'شبكة حلب نيوز اا لحظات بعد القصف بالصواريخ على حي كرم الطراب وحالة الهلع بين المدنيين', location: {lat:36.201027, lng:37.208805}
}, {string: 'مميز شبكة حلب نيوز اا لحظة سقوط برميل متفجر على حي كرم الطراب', location: {lat:36.201027, lng:37.208805}
}, {string: 'حلب نيوز::اثا ر الدمار نتيجة سقوط صاروخ من الطيران الحربي على حي المرجة 13-7=2015', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز:حي المرجة مناشدة الأهالي للجهات المعنية والمجلس المحلي يلبي النداء27-1-2015', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز: المرجة مناشدة الأهالي لجهات المعنية ولمجلس المحلي يلبي النداء26-1-2015', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب نيوز::منظمة ميرسي تقوم بتوزيع ملابس شتويه على أهالي حي المرجه 11-1-2015', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز::حي المرجه ||معانات كبيره من الأهالي بسبب تراكم القمامه 22-10-2014', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز: قطاع حلب القديمه يقوم بأصلاح مجرورالمياه في المرجه وحلب القديمه 22-10-2014', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز - حي المرجه || آثار الدمار نتيجة سقوط برميل متفجر على الحي 15-9-2014', location: {lat:36.17567, lng:37.186871}
}, {string: 'هام اا جولة لكاميرا حلب نيوز في حي المرجة 9 3 2014', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز:حي المرجة ||اثار الدمار الذي خلفه القصف بالبراميل المتفجرة على الحي 17-6-2014', location: {lat:36.17567, lng:37.186871}
}, {string: 'جثث الشبيحة في حي المرجة من أشتباكات قرية عزيزة 27-2-2014', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز|| حي المرجة- رسالة من احد المدنيين للأهالي بمناطق الخاضعة لسيطرة النظام ||24-2-2014||', location: {lat:36.17567, lng:37.186871}
}, {string: 'هام اا شبكة حلب نيوز اا جولة تظهر الدمار الهائل للمباني في حي المرجة 13 2 2014', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز :: بقايا برميل لم ينفجر في حي المرجة والثوار يستخرجون البارود منه 10-2-2014', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز اا آثار الدمار الذي حل بحي المرجة بعد القصف العنيف الذي تعرض له الحي 4 2 2014', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز||حي المرجة-آثار الدمار جراء القصف بالطيران الحربي', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز||حي المرجة-آثار الدمار جراء القصف بالطيران الحربي صباح الجمعة', location: {lat:36.17567, lng:37.186871}
}, {string: 'تقرير مصور اا يظهر الأحداث التي تعرض لها حي المرجة اليوم', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز اا آثار القصف بالبراميل المتفجرة على منطقة حريبل في حي المرجة', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب المرجة دمار هائل وعشرات الضحايا نتيجة قصف الطيران للمرة الثالثة', location: {lat:36.17567, lng:37.186871}
}, {string: 'الدمار الذي خلفه القصف على حي المرجة 23/12/2013', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب المرجة قصف جوي على الحي خلف اصابات واضرار مادية', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : إصلاح التيار الكهربائي بعد قصف الطيران الحربي للحي', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : الدمار الهائل الذي خلفه الطيران الحربي , وانتشال الجثث من تحت الانقاض', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب المرجة الدمار الذي خلفه الصاروخ الفراغي على الحي وراح ضحيته العشرات', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز : تقرير مصور يوضح حجم الدمار الذي خلفه القصف بالطيران الحربي على حي المرجة', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب-المرجة : تحليق الطيران الحربي (ال76 ) في سماء مدينة حلب', location: {lat:36.17567, lng:37.186871}
}, {string: 'اثار الدمار الذي احدثه البرميل الثامن على حي المرجة بتاريخ 15/12 حديقة الحرابلة', location: {lat:36.17567, lng:37.186871}
}, {string: 'اثار الدمار البرميل السابع الذي سقط على حي المرجة بتاريخ 15/12 منازل ال شروخ', location: {lat:36.17567, lng:37.186871}
}, {string: 'اثار الدمار الذي خلفه البرميل السادس على حي المرجة بتاريخ 15/12 منازل ال اغا', location: {lat:36.17567, lng:37.186871}
}, {string: 'اثار الدمار الذي خلفه البرميل الخامس على حي المرجة بتاريخ 15/12 منازل ال غش وسكني', location: {lat:36.17567, lng:37.186871}
}, {string: 'اثار الدمار الذي خلفه برميل الرابع عل حي المرجة بتاريخ 15/12 منازل ال دعاس', location: {lat:36.17567, lng:37.186871}
}, {string: 'اثار الدمار الذي خلفه البرميل الثاني على حي المرجة بتاريخ 15/12/2013 منازل ال عزيزة', location: {lat:36.17567, lng:37.186871}
}, {string: 'اثار الدمار الذي خلفه البرميل الاول على حي المرجة منازل ال واوي', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : البرد والقصف لم يمنع الاطفال من اللعب بالثلج', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب -المرجة : الاولاد أثناء لعبهم في مدارس حلب المحررة', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب- المرجة : تحليق الطيران المروحي وإلقاء البراميل المتفجرة على أحياء حلب', location: {lat:36.17567, lng:37.186871}
}, {string: 'المرجة -توزيع حصص غذائية على النازحين والاسرالفقيرة بالحي', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : آثار الدمار الذي خلفه سقوط برميل متفجر على الحي', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : توزيع القرطاسية على الطلاب في مدرسة عمر ابن الخطاب', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : مؤلم جدا انتشال جثة أحد الاطفال من تحت الانقاض', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : آثار الدمار الذي خلفه القصف بالصواريخ الفراغية من طائرات الاحتلال الاسدي', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : مظاهرة في جمعة انفروا خفافا وثقالا', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : رغم الظروف الصعبة إعادة تأهيل مستوصف الشيخ لطفي في الحي', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : اصطفاف الاهالي امام شركة المياه للحصول على الماء', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : مدرسة عمر ابن الخطاب : الطلاب اثناء نهاية الدوام', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : جمعة الحل في لاهاي لا في مؤتمر جنيف (2)', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : إصلاح الشبكة الكهربائية في الحي', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب- المرجة : الاطفال يرددون الاهازيج الثورية في احتفالهم بالعيد', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : جانب من أجواء العيد في الحي', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : الاهالي يشتكون من عدم إصلاح أحدى محولات الكهرباء الرئيسية في الحي', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : محاضرة بعنوان (طرائق التربية والتدريس)', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : افتتاح مدرسة عمر ابن الخطاب ج2', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : حفل افتتاح مدرسة عمر ابن الخطاب ج1', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : فرحة الاطفال باستلامهم الكتب المدرسية الجديدة - مدرسة عمر ابن الخطاب', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : عمال النظافة في الحي يشتكون عدم تأمين مستلزماتهم', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : مظاهرة الحي في جمعة شكرا تركيا 4-10-2013 من أمام منزل الشهيد علاء الشاغل', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : مظاهرة الحي في جمعة شكرا تركيا 4-10-2013', location: {lat:36.17567, lng:37.186871}
}, {string: 'المرجة - الدخان الكثيف المتصاعد نتيجة احتراق معمل نايلون عصر اليوم 30-9--2013', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب المرجة مدرسة عمر ابن الخطاب بعد تأهيلها', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب المرجة : بإمكانيات بسيطة وجهود كبيرة إعادة تفعيل مدارس الحي', location: {lat:36.17567, lng:37.186871}
}, {string: 'مدارس حي المرجة (واقع مؤلم وجهود لإعادة التأهيل )', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب نيوز المرجة جولة على احدى المدارس اثناء تسجيل الطلاب للعام الدراسي الجديد', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز المرجة خروج مظاهرة من جامع مقر الانبياءتهتف للحرية وتطالب بإسقاط النظام 13 9 2013', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : إعادة تأهيل المدارس في الحي برعاية جمعية ( لِين) للإغاثة', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : جمعية بشائر الشام ندوة علمية بعنوان : (مفهوم الخوف في الاسلام )', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : لقاء مع مدير المركز الطبي في الحي', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : استطلاع للرأي حول الضربة الامريكية المحتملة على سوريا', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : كلمة لأحد علماء الحي عن المجزرة 23-8-2013 ج2', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب المرجة : كلمة لعلماء الحي عن المجزرة 22-8-2013 ج1', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب المرجة مظاهرة لتنديد بمجزرة الغوطة 23 8 2013 ج2', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : مظاهرة لتنديد بمجزرة الغوطة 23-8-2013 ج1', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب - المرجة : ياغوطة المرجة معاكِ للموت , ومارح نركع جيبو الكيماوي والمدفع', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب المرجة وقفة احتجاجية للتنديد بمجزرة الغوطة والتنديد بالموقف الدولي السلبي ج2', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب المرجة وقفة احتجاجية للتنديد بمجزرة الغوطة والموقف السلبي الدولي', location: {lat:36.17567, lng:37.186871}
}, {string: 'مدارس حي المرجة : (واقع مؤلم وجهود لإعادة التأهيل )', location: {lat:36.17567, lng:37.186871}
}, {string: 'مدارس حي المرجة (واقع مؤلم وجهود لإعادة التأهيل )', location: {lat:36.17567, lng:37.186871}
}, {string: 'الادارة الاسلامية للخدمات : اصلاح الشبكة الكهربائية في حي المرجة', location: {lat:36.17567, lng:37.186871}
}, {string: 'الادارة الاسلامية للخدمات : ترحيل القمامة في حي المرجة', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب نيوز حي المرجة شاهد الاثارة شاب يصعد الى عامود الكهرباء لإصلاحها بنفسه', location: {lat:36.17567, lng:37.186871}
}, {string: 'القاء القبض على مجموعة مسلحة في حي المرجة من قبل عناصر الجيش الحر11-8-2013', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب نيوز المرجة حفل للأطفال بمناسبة عيد الفطر في مسجد مصعب بن عمير', location: {lat:36.17567, lng:37.186871}
}, {string: 'شبكة حلب نيوز::حي المرجه ||اللحظات الأولى للقصف على حي المرجه 12-11-2014', location: {lat:36.17567, lng:37.186871}
}, {string: 'اللحظات الأولى للقصف على حي المرجة وإسعاف أطفال مصابين نتيجة القصف 23/12/2013', location: {lat:36.17567, lng:37.186871}
}, {string: 'هام جدا :: لحظة سقوط ثلاثة براميل على حيي المرجة وباب النيرب 23/12/2013', location: {lat:36.17567, lng:37.186871}
}, {string: 'حلب نيوز | تصاعد أعمدة الدخان نتيجة احتراق حاجز تابع لقوات النظام في حيّ المشارقة 4-10-2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'حلب نيوز | ستهداف مقرات قوات النظام في حيي المشارقة والإذاعة بمدفع جهنم ج2 4-10-2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'حلب نيوز | استهداف مقرات قوات النظام في حيي المشارقة والإذاعة بمدفع جهنم ج1 4-10-2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'حلب معبر كراج الحجز || حال المدنين وسط اشتباكات و القصف 27-10-2013', location: {lat:36.198621, lng:37.137005}
}, {string: 'حلب نيوز - كتائب الخضراء || استهداف تجمعات قوات النظام في حي المشارقة وبستان الزهرة15-8-2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'حلب نيوز - كتائب الخضراء| استهداف تجمعات قوت النظام بحي المشارقة بمدفع محلي الصنع 24-6-2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'شبكة حلب نيوز: إصابات محققة على حاجز لقوات النظام في حي المشارقة 1-6-2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'هام اا شبكة حلب نيوز اا المترس الذي يتم منه قنص الدنيين على معبر كراج الحجز 30 3 2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'هام اا مراسل شبكة حلب نيوز اا عناصر الهلال الأحمر يقومو بإجلاء المصابين على معبر كراج الحجز 30 3 201', location: {lat:36.198621, lng:37.137005}
}, {string: 'هام اا شبكة حلب نيوز اا امرأة مقنوصة في معبر كراج الحجز تزحف لإنقاذ نفسها 30 3 2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'شبكة حلب نيوز|| كتيبة اسود الاسلام - تقوم باستهداف قوات النظام المتمركزة بحي المشارقة بقذائف الهاون', location: {lat:36.198621, lng:37.137005}
}, {string: 'شبكة حلب نيوز||حي المشارقة- رصد ساحة الرئيس||2-3-2014||', location: {lat:36.198621, lng:37.137005}
}, {string: 'هام اا شبكة حلب نيوز اا جولة لكاميرا حلب نيوز على معبر كراج الحجز تظهر الإزدحام الشديد 4 2 2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'هام اا شبكة حلب نيوز اا رصد الإزدحام الشديد على معبر كراج الحجز 2 2 2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'هاااام - شبكة حلب نيوز :: رصد ازدحام المدنين عند حاجز حي المشارقة 30-1-2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'شبكة حلب نيوز :: رصد حركة مرور المدنين على معبر كراج الحجز 30-1-2014', location: {lat:36.198621, lng:37.137005}
}, {string: 'هام اا شبكة حلب نيوز اا رصد الإزدحام الشديد على معبر كراج الحجز في حي المشارقة', location: {lat:36.198621, lng:37.137005}
}, {string: 'حلب-السكري || خروج مظاهرة من جامع أويس القرني تتطالب بإغلاق معبر كراج الحجز 11-10-2013', location: {lat:36.198621, lng:37.137005}
}, {string: 'مجلس القضاء الموحد - معبر كراج الحجز - مكافحة المهربين', location: {lat:36.198621, lng:37.137005}
}, {string: 'معبر كراج الحجز || تراكم الأوساخ في المعبر وإحراقها بشكل يومي 9-10-2013', location: {lat:36.198621, lng:37.137005}
}, {string: 'حلب - بستان القصر || كتيبة خالد خليفة استهداف نقاط تمركز قناصات قوات النظام في حي المشارقة 9-9-2013', location: {lat:36.198621, lng:37.137005}
}, {string: 'عدسة حلب نيوز :: تكشف حاجز النظام في حي المشارقة', location: {lat:36.198621, lng:37.137005}
}, {string: 'حلب نيوز| الفرقة 16 مشاة تقوم بدك معاقل النظام بمدفع جهنم محلي الصنع في حي الميدان 2-8-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز:: الفرقة 16 مشاة تقوم بدك معاقل النظام بمدفع جهنم محلي الصنع في جبهة الميدان 15-7-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز::اشتباكات بين الفرقة 16 مشاة وقوات النظام على جبهة الميدان 11-7-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز::لواء السلطان مراد جانب من الأشتباكات على جبهة الميدان 30-5-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز::لواء السلطان مراد يستهدف تجمعات النظام بقذائف الجهنم على جبهة الميدان 30-5-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز::لواء السلطان مراد يستهدف تجمعات قوات النظام في مبنى أكثار البذار في حي الميدان 9-3-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز::لواء سلطان مراد يستهدف تجمعات النظام على جبهة الميدان بهاون الموجه عيار (120)5-3-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز::لواء السلطان مراد يستهدف بهاون الموجه مبنى اكثار البذاروالالبان في حي الميدان 3-3-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز| استهداف أماكن قوات النظام في حيّ الميدان بقذائف مدفع جهنم من قبل لواء سلطان مراد 15-2-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز::لواء السلطان مراد ::استهداف قوات النظام على جبهة الميدان بمدفع موجه 2-2-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز::لواء سلطان مراد استهداف قوات النظام بقذائف الهاون على جبهة الميدان 23-1-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز::لواء السلطان مراد ىستهدف قوات النظام بمدفع (ب 9) في حي الميدان 16-1-2015', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز : ألوية فجر الحرية : استهداف قوات النظام على جبهة الميدان في حلب 29-9-2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : استهداف المدعو "فافيني" مع الضباط من قبل ألوية فجر الحرية 23 9 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : قنص قوات النظام من قبل كتيبة شهداء مريمين 15 9 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : محاولة قنص قوات النظام في شارع مخفر الميدان 14 9 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : لواء السلطان مراد يستهداف مبنى لقوات النظام رداً على مجزرة الحيدرية 5 9 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : لواء السلطان مراد يستهداف مفرزة الجوية بهاون موجه 120 مم 5 9 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : استهداف مواقع النظام بالرشاش من قبل ألوية فجر الحرية 28 8 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'شبكة حلب نيوز-كلمة لأحد القادة الميدانيين واشتباكات عنيفة بالقرب من ضاحية الأسد 8-2', location: {lat:36.220239, lng:37.167606}
}, {string: 'هام - حلب نيوز || الميدان : تفجير ثلاث مباني من قبل ألوية فجر الحرية وقتل أكثر من 30 جندي 2 6 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : لواء السلطان مراد يقوم بقصف مواقع النظام في حي الميدان 17 4 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || ألوية فجر الحرية : جانب من التمهيد بمدافع جهنم على مواقع النظام في حي الميدان 12 4 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || إعلان معركة " نصرة كسب من قلب حلب " في الشيخ مقصود والميدان والشيخ طه 12 4 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || لواء شهداء بدر : دك معاقل النظام في حي الميدان بمدفع جهنم 30 3 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : دك معاقل النظام بهاون محلي الصنع من قبل لواء السلطان مراد 12 3 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : أحد عناصر النظام يقوم بسب الله والرسول ويقول " بشار أكبر " 9 2 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || كتائب المنتصر بالله : قصف تجمعات النظام في حي الميدان بهاون 60مم 4 2 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'لواء السلطان مراد || قصف مواقع النظام في حي الميدان بمدفع 50مم رداً على مجازر النظام في حلب 3 2 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'لواء السلطان مراد : قصف مواقع النظام في الميدان بقذائف هاون 80مم رداً على مجازره في حلب 3 2 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : لواء السلطان مراد يقوم بدك معاقل النظام في حي الميدان بالهاون 1 1 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : كتيبة المنتصر بالله تقوم بدك معاقل النظام في حي الميدان بالهاون 1 1 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : لواء السلطان مراد يقوم بدك معاقل النظام في الحي بقذائف الهاون 28 12 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : دك معاقل النظام بعشرات الهاونات من قبل لواء السلطان مراد 22 12 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز|| الميدان:الهلال الأحمر يقوم بإدخال المازوت لشركة المياه بالتنسيق مع لواء السلطان مراد', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : استهداف دشم النظام برشاش 14.5 من قبل لواء السلطان مراد 19 12 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : استمرار تصاعد الدخان بعد استهداف الحي بعشرات قذائف الهاون 17 12 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : قصف مكثف بالهاون على تجمعات النظام بالحي من قبل لواء السلطان مراد 17 12 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : استهداف دشم النظام بدوشكا وإسقاطه من قبل لواء السلطان مراد ج2 4 12 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : استهداف دشم النظام بدوشكا وإسقاطه من قبل لواء السلطان مراد ج3 4 12 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : استهداف دشم النظام بدوشكا وإسقاطه من قبل لواء السلطان مراد ج1 4 12 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : لواء السلطان مراد يقوك بدك معاقل النظام بقذائف الهاون 19 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'الميدان || خروج عناصر الهلال الأحمر بعد إدخال المواد 17 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'الميدان || أدخال مولدة جديدة عبر منطقة الاشتباك برفقة عناصر الهلال الأحمر 17 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : عناصر منظمة الهلال الأحمر يبحثون عن الجثث في منطقة الاشتباك 12 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : تسليم جثة الشهيد لعناصر لواء السلطان مراد في شركة المياه 12 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : انتشال الجثث من منطقة الاشتباك من قبل منظمة الهلال الأحمر ج1 12 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : انسحاب عناصر الهلال الأحمر بعد انتهاء عملية الانتشال وضخ الوقود 12 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : انتشال جثة المسن المقنوص قبل أيام من منطقة الاشتباك 12 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : انتشال جثة شهيد من الجيش الحر من قبل الهلال الأحمر 12 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : انتشال الجثث من منطقة الاشتباك من قبل منظمة الهلال الأحمر ج2 12 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : إحدى الجثث التي كانت على طريق الدائري الشمالي 12 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'الميدان : حرص قادة لواء السلطان مراد على حياة عناصر الهلال الاحمر رغم اختراق النظام للهدنة الموقعة', location: {lat:36.220239, lng:37.167606}
}, {string: 'هاااااام : الميدان || قنص المسن المقنوص مرة أخرى بعد سؤال مقاتل لعنصر النظام سبب إجرامه 2 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'الميدان غناء أحد مقاتلي النظام بلغة أجنبية غير مفهومة يعتقد فارسية 2 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : لواء السلطان مراد يستهدف فرع المدهمة بمدفع جهنم 2 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || حلب - الميدان : قصف فرع المداهمة براجمة الصواريخ من قبل لواء السلطان مراد 1 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : دك معاقل النظام بالهاون من قبل لواء السلطان مراد ج1 30 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : دك معاقل النظام بالهاون من قبل لواء السلطان مراد ج4 30 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : دك معاقل النظام بالهاون من قبل لواء السلطان مراد ج3 30 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : دك معاقل النظام بالهاون من قبل لواء السلطان مراد ج2 30 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : تجهيز قذائف الهاون لدك معاقل النظام من قبل لواء السلطان مراد 30 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : دك معاقل النظام في الحي بهاون عيار 120 مم من قبل لواء السلطان مراد ج1', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : دك معاقل النظام في الحي بهاون عيار 120مم من قبل لواء السلطان مراد ج2', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : استهداف قناص الميدان بقذيفة أر بي جي من قبل لواء السلطان مراد 29 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : قنص قوات النظام في الحي من قبل لواء السلطان مراد 29 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || حلب الميدان : قصف ساحة كنيسة دير وارطان بالهاون من قبل لواء السلطان مراد 25 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || حلب الميدان : تمشيط أحد مباني قوات النظام من قبل لواء السلطان مراد 25 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز||حلب الميدان : اشتباكات عنيفة بالأسلحة الثقيلة بين قوات النظام ولواء السلطان مراد ج2 25 10', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز||حلب الميدان : اشتباكات عنيفة جدا بالدوشكا بين لواء السلطان مراد وقوات النظام ج1 25 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز||حلب الميدان : اشتباكات عنيفة بالأسلحة الثقيلة بين قوات النظام ولواء السلطان مراد ج1 25 10', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز ||حلب الميدان :دك مبنى تتحصن فيه قوات النظام بقذيفة أربي جي من قبل لواء السلطان مراد 25 10', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || ألوية فجر الحرية : لحظة سقوط قذيفة مدفع حهنم على مواقع النظام في حي الميدان 24 8 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'مميز -حلب نيوز || لواء شهداء بدر : دك معاقل النظام بمدفع جهنم في الميدان ولحظة سقوط القذائف 8 3 2014', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : لحظة دخول عناصر منظمة الهلال الأحمر لمنطقة الاشتباك 12 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : لحظة دخول صهريج المازوت لداخل شركة المياه بمرافقة الهلال الأحمر 12 11 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز || الميدان : لواء السلطان مراد يدك معاقل النظام بمدفع هاون ولحظة سقوط القذائف 31 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز||الميدان: استهداف بمدفع جهنم ولحظة سقوط المقذوف داخل الفرع من قبل لواء السلطان مراد', location: {lat:36.220239, lng:37.167606}
}, {string: 'هاااام جدا || حلب نيوز || الميدان : لحظة قنص مدني من قبل قوات النظام برصاصتين متفجرتين 30 10 2013', location: {lat:36.220239, lng:37.167606}
}, {string: 'حلب نيوز : حركة الفجر تقصف مبنى المواصلات شرقي مدينة حلب 13-11-2013', location: {lat:36.200504, lng:37.15404}
}, {string: 'شبكة حلب نيوز: تهدم جزء من سور القلعة بعد تفجير هز حلب القديمة مساء أمس 12-7-2015', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز:آثارالدمار داخل فندق بيت صلاحية في حلب القديمة بعد سقوط صاروخ مصدره القلعة11-7-2015', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز: قلعة حلب | اشتباكات عنيفة في محيط القلعة والثواريستهدفون القلعة بقذائف هاون 11-6-2015', location: {lat:36.199083, lng:37.162843}
}, {string: 'حلب نيوز::قصف بالبراميل المتفجره على حي جب القبه بالتزامن مع استهدف الحي من قناص القلعة 3-6-2015', location: {lat:36.199083, lng:37.162843}
}, {string: 'حلب نيوز::رصد دبابه فجره الثوار خلال الاشتباكات مع قوات النظام في محيط قلعة حلب 30-12-2014', location: {lat:36.199083, lng:37.162843}
}, {string: 'حلب نيوز::رصد قلعة حلب واثار الدمار الناتجه عن الأشتباكات بين الثوار وقوات النظام 3-12-2014', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز|| حلب القديمة||غرفة مدفعية حلب استهداف احد جنود النظام المتمركزين على اسوار قلعة حلب', location: {lat:36.199083, lng:37.162843}
}, {string: 'حلب نيوز - كتائب الخضراء || استهداف تجمعات قوات النظام في محيط القلعة بقذائف الهاون 17-8-2014', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز::قوات النظام المتمركزه في قلعة حلب تستهدف برشاشات اماكن تواجد المدنين25-5-2014', location: {lat:36.199083, lng:37.162843}
}, {string: 'حلب نيوز || محيط القلعة : تصاعد الدخان بعد تفجير المجاهدين لأحد معاقل النظام 27 4 2014', location: {lat:36.199083, lng:37.162843}
}, {string: 'الجبهة الاسلاميه كتيبة عمرو بن الجموح اشتباكات قوية في محيط القلعه', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز اا آثار القصف على منطقة ساحة حمد بحلب القديمة واستخراج طفلة من تحت الأنقاض 21 2 2014', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز || آثار القصف بالطيران الحربي على حلب القديمة منطقة ساحة حمد 28-12-2013', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز||احتراق لمبنى الكيالي في حلب القاديمة واحد المجاهدين يشرح سبب الاحتراق||12-12-2013||', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز -رصد مبنى قيادة الشرطة الأسبق عند محيط قلعة حلب 1-9-2013', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز -رصد الدمار في محيط قلعة حلب 1-9-2013', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز-رصد المدخل الرئيسي لقلعة حلب والمباني المحيطة 1-9-2013', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز - رصد مبنى القصر العدلي الواقع محيط قلعة حلب 1-9-2013', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز :: إستهداف حواجز الشبيحة في محيط قلعة حلب 14-8-2013', location: {lat:36.199083, lng:37.162843}
}, {string: 'شبكة حلب نيوز || اللحظات الاولى لتفجير مبنى الكارلتون على ايدي الوية صقور الشام', location: {lat:36.199083, lng:37.162843}
}, {string: 'لواء السلطان مراد::فيلق الشام استهداف قوات النظام بمدفع (106)على جبهة مطار النيرب العسكري 5-4-2015', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز::الجبهة الشاميه سرية الهاون تستهدف مطار النيرب العسكري بمدافع الهاون 24-3-2015', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز::لواء سلطان مراد يدك معاقل النظام في مطار النيرب العسكري بقذئف الهاون (120)27-2-2015', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز::لواء سلطان مراد يستهدف مطار حلب الدولى بمدفع الهاون (120)وتحقيق أصابات مباشره 27-2-2015', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز : اشتباكات بالأسلحة الخفيفة والمتوسطة في جبهة مطار النيرب العسكري 5-12-2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز::كتيبة ابو موسى تقوم بستهداف مطار النيرب العسكري بقذائف الهاون 13-11-2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز:كتيبة "أبو موسى" التابعة لغرفة عمليات مطار النيرب العسكري تستهدف المطار بقذائف الهاون', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز II استهداف تجمعات لقوات النظام بقذائف الجهنم على جبهة مطار النيرب العسكري', location: {lat:36.183433, lng:37.221851}
}, {string: 'هام اا شبكة حلب نيوز اا جسر مطار حلب تحت أنظار الثوار مباشرة 23 2 2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'برمو كتائب أبو عمارة على جبهة المطار', location: {lat:36.183433, lng:37.221851}
}, {string: 'هام اا شبكة حلب نيوز اا جولة لكاميرا حلب نيوز على جبهة مطار النيرب العسكري برفقة كتائب أبو عمارة', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز || مطار حلب الدولي : قصف المطار بالهاون من قبل قوات النخبة السورية 8 2 2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'هاااااام - حلب نيوز || مطار حلب الدولي : تحليق طائرة تجسس صغيرة حول المطار 8 2 2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز || مطار حلب الدولي : اشتباكات عنيفة بين قوات النخبة السورية وقوات النظام 7 2 2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز || مطار حلب الدولي : استهداف قوات النظام بالدوشكا من قبل قوات النخبة السورية 7 2 2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز || مطار حلب الدولي : قوات النخبة السورية تقوم بقصف المطار بالهاون 7 2 2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز || مطار حلب الدولي : استهداف قوات النظام بهاون 50 مم من قبل قوات النخبة السورية 6 2 2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز || مطار حلب الدولي:اشتباكات عنيفة جداً بين قوات النخبة وقوات النظام في محيط المطار 6 2 2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :: كتائب أبو عمارة تقصف تجمع قوات النظام في محيط مطار النيرب العسكري 5-1-2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز : سيطرة الثوار على جسر "النيرب" الذي يصل إلى مطار النيرب العسكري ٢٦-١-٢٠١٤', location: {lat:36.183433, lng:37.221851}
}, {string: 'هام جدا ااشبكة حلب نيوز اا جولة ميدانية مع قائد عسكري على خط جبهة المطار', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز || قوات النخبة : تقرير عن ضرب الصواريخ لمطار حلب وسقوط برميل قرب الرماة 19 1 2014', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز || تجمع ألوية النخبة الإسلامية تستهدف مطار النيرب العسكري بصواريخ محلية الصنع 25-12-2013', location: {lat:36.183433, lng:37.221851}
}, {string: 'آثار الدمار الذي خلفه سقوط براميل متفجرة على اتستراد المطار قرب الحاووظ', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :: آثار الدمار في حي المعصرانية بسبب القصف بقذائف الدبابات من مطار النيرب العسكري', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :: بيان صادر عن حركة النهضه والعدالة بإستهداف مطار النيرب العسكري بقذائف الهاون', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :: إستهداف مطار النيرب العسكري بقذائف الهاون من قبل حركة النهضة والعدالة', location: {lat:36.183433, lng:37.221851}
}, {string: 'قصف مطار حلب', location: {lat:36.183433, lng:37.221851}
}, {string: 'أستهداف صالة النجوم بجانب المطار', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :: رصد إحدى السيارات التي تقوم بنقل المصابين من داخل مطار النيرب العسكري', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :: رصد أحد عناصر النظام وهو متوجه إلى داخل مطار النيرب العسكري 16-11-2013', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب -مطار النيرب : سيارات الاطفاء تطفئ الحرائق التي خلفتها صواريخ المجاهدين', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب مطار النيرب قوات النظام تخلي المدرج من الطيران الحربي بهد استهدافه بالصواريخ', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب - مطار النيرب العسكري : لواء التوحيد الثوار يستهدفون المطار بصواريخ غراد واصابات مباشرة', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب - مطار النيرب العسكري :لواء التوحيد - الله اكبر تدمير عدة طائرات نتيجة استهدافهم بصواريخ غراد', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :: جانب من الاشتباكات عند مطار النيرب العسكري 11-11-2013', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :كلمة لقائد الفوج 26 التابع للواء التوحيد عن الاحداث الاخيرة باللواء 80 والمطار النيرب', location: {lat:36.183433, lng:37.221851}
}, {string: 'رصد عناصرمن الجيش النظام فوق جسر سوق الجمعة الواصل بين مدفعة الراموسة ومطار النيرب العسكري', location: {lat:36.183433, lng:37.221851}
}, {string: 'كتيبة شهداء تادف - استهداف مطار النيرب العسكري بصاروخ محلي الصنع 24-10-2013', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب - مطار النيرب العسكري : رصد الطائرات الحربية الرابضة بالمطار', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :: رصد مبنى الزيوت والمطاحن جانب مطار النيرب العسكري', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :: شرح من احد القادات عن متاريس النظام داخل مطار النيرب العسكري', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز :: رصد مطار حلب الدولي عن قرب', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب- مطار النيرب العسكري || قصف المطار بصواريخ محلية الصنع 29-8-2013', location: {lat:36.183433, lng:37.221851}
}, {string: 'لواء السلطان مراد ::اللحظات الأولى من بدء المعركه على جبهة كرم الطراب ومطار النيرب العسكري 5-4-2015', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز || مطار حلب الدولي : لحظة ألقاء الطيران للبرميل المتفجر حتى سقوطه قرب المطار', location: {lat:36.183433, lng:37.221851}
}, {string: 'شبكة حلب نيوز|| هام للأعلام|| جولة لحظة استهداف الطيران الحربي اوتستراد مطار النيرب العسكري', location: {lat:36.183433, lng:37.221851}
}, {string: 'حلب نيوز::شهداء وجرحى نتيجة القصف بالصواريخ الفراغية على حي باب النيرب 16-7-2015', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز::اثار الدمار نتيجة سقوط برميل متفجر على حي باب النيرب 1-7-2015', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز::اثار الدمار نتيجة سقوط برميل متفجر على حي باب النيرب 31-5-2015', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز: آثار قصف طيران النظام على حي باب النيرب ببرميل متفجّر 2015/05/29', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز::اثار الدمار نتيجة سقوط برميل متفجرفي مدرسة باب النيرب وشهادة الاطفال والمدنيين 19-5-2015', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز::اثار الدمار نتيجة سقوط برميل متفجر على مدرسة في باب النيرب وشهادة الاطفال والمدنيين', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز::انتشال شهداء من تحت الانقاض نتيجة سقوط برميل متفجر على حي باب النيرب 19-5-2015', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز - باب النيرب | آثار الدمار الذي خلفه سقوط برميل متفجر على الحي صباح اليوم 25-4-2015', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز | باب النيرب -19-4-2015 | سقوط برميل متفجر على الحي و اثار الدمار فيه', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز:باب النيرب : آثار الدمار في الحي بعد سقوط برميل متفجر أدى الى اضرار مادية فقط17-3-2015', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز: حي باب النيرب| آثار الدمارفي الحي بعد القصف بالبراميل المتفجرة أمس 25-1-2015', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز: حي باب النيرب| المظاهرة التي خرجت ضد الصحيفة الفرنسية شارلي إيبدو 17-1-2015', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز:: استشهاد شاب ودمار في حي باب النيرب جراء القصف المدفعي 5-12-20', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز::جمعية ميرسي تقوم بتوزيع سلل غذائيه على أهالي حي باب النيرب 2-12-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز:||باب النيرب| آثار القصف على الحي بعد سقوط قذيفة مساء الثلاثاء 25_11_2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز::سقوط صاروخ من الطيران الحربي على حي باب النيرب والأضرار ماديه 14-11-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز::حي باب النيرب ||ضحايا وجراحى جراء سقوط برميل على الحي 11-11-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز::حي باب النيرب ||رصد سقوط البرميل على الحي ودمار هائل في محال للشحن المدني 11-11-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز ::حي باب النيرب ||قصف على الحي ببرميل متفجر والأضرار ماديه 25-8-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز |الدفاع المدني اثناء محاولة استخراج العالقين من تحت الانقاض في حي باب النيرب 11-8-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز ::حي باب النيرب ||سقوط برميل متفجر على مقبرة الحي ولم ينفجر 24-7-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز :حي باب النيرب جامع الطرنطائية اثار الدمار بعدالقصف بالبراميل المتفجيرة28-5-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز::باب النيرب||أثار الدمار في الحي أثرة أستهداف بالبراميل المتفجره 18-5-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز اا آثار القصف بالبراميل على حي باب النيرب 4 4 2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز اا المجلس المحلي لمدينة حلب يزيل الأوساخ من حي باب النيرب 23 3 2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز||حي باب النيرب- قصف بالطيران الحربي بالصواريخ ولم تنفجر ||1-3-2014||', location: {lat:36.170824, lng:37.226658}
}, {string: 'الطيران الحربي يستهدف حي باب النيرب بالصواريخ 27-2-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'هام اا شبكة حلب نيوز اا أهالي حي باب النيرب يوجهون نداء للمعنيين بإزالة الأوساخ بسبب تفشي الأمراض', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز || باب النيرب : آثار الدمار الناتج عن قصف البراميل المتفجرة 2 2 2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز :: حي باب النيرب- آثار الدمار جراء القصف بالطيران الحربي 30-1-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز اا الدمار الذي حل بمنازل المدنيين جراء القصف بالبراميل المتفجرة على حي باب النيرب', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز|| حي باب النيرب- آثار الدمار جراء القصف بالطيران الحربي على الحي', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكةحلب نيوز||حلب حي باب النيربالادارة العامة للخدمات تقوم بأصلاحالكهرباء بسبب تضررها بالقصف', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز || تقرير مصور عن القصف بالبراميل على حي باب النيرب 23-21-2013', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب نيوز || قصف بالبراميل المتفجرة على حي باب النيرب 23-12-2013', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب -بقايا البرميل الذي سقط على اتستراد مطار النيرب قرب الحاووظ', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب -باب النيرب : توزيع المساعدات الغذائية على الاهالي', location: {lat:36.170824, lng:37.226658}
}, {string: 'المكتب الاغاثي - باب النيرب : توزيع المساعدات الغذائية على الاهالي لشهر ايلول', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب - باب النيرب : لقاء مع المسؤو الاغاثي في الحي يتحدث عن شحّ الموارد', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب باب النيرب جمعية الانصار الخيرية توزع مساعدات مالية لأُسر الشهداء في الحي', location: {lat:36.170824, lng:37.226658}
}, {string: 'هام | حلب نيوز | مؤثر لحظة اخراج الشهيدة الطفلة سيرين غش نتيجة القصف على حي باب النيرب 12-4-2015', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز-اللحظات الاولى بعد سقوط برميل متفجر على حي باب النيرب-18-8-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز-اللحظات الاولى بعد سقوط برميل متفجر على حي باب النيرب 15-8-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز-الحظات الاولى بعد سقوط برميل متفجر على حي باب النيرب-14-8-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'شبكة حلب نيوز-الحظات الاولى بعد سقوط برميل متفجر على حي باب النيرب وصور شهداء واثار الدمار-13=8-2014', location: {lat:36.170824, lng:37.226658}
}, {string: 'حلب - الأنصري الشرقي || آثار الدمار مكان ستهداف الطائرة الحربي ظهر اليوم في الحي 2-4-2014', location: {lat:36.177737, lng:37.145869}
}, {string: 'حلب الانصاري الشرقي || محاولة استخراج الشهداء من تحت ركام الانقاض 23-2-2013', location: {lat:36.177737, lng:37.145869}
}, {string: 'حلب الانصاري الشرقي || أثار الدمار الذي خلفه قصف الطيران الحربي على الحي 23-2-2014', location: {lat:36.177737, lng:37.145869}
}, {string: 'حلب"مظاهرة في حي الانصاري الشرقي طالبت بتوحد جيش حر', location: {lat:36.177737, lng:37.145869}
}, {string: 'حلب - الانصاري الشرقي || توزيع المعونات الإغاثية لأهالي الحيّ 18-8-2013', location: {lat:36.177737, lng:37.145869}
}, {string: 'حلب-الانصاري الشرقي || توزيع بطاقات الامتحان لطلاب الشهادة الثانوية 14-8-2013', location: {lat:36.177737, lng:37.145869}
}, {string: 'الاشرفية|| 6 6 2014 || بعض المصابين نيجة القصف على السكن الشبابي +18 .', location: {lat:36.242108, lng:37.13954}
}, {string: 'الاشرفية|| 6 6 2014 || اثار القصف لاحد البراميل التي سقطت اليوم على حي السكن الشبابي .', location: {lat:36.242108, lng:37.13954}
}, {string: 'حلب نيوز || السكن الشبابي 29 4 2014 || اسعاف بعض المصابين نتيجة استهداف الطيران الحربي للحي .', location: {lat:36.242108, lng:37.13954}
}, {string: 'حلب نيوز || السكن الشبابي 29 4 2014 || الخراب واشتعال النيران نتيجة استهداف الحي من طائرات الاسد .', location: {lat:36.242108, lng:37.13954}
}, {string: 'حلب نيوز || السكن الشبابي 12 4 2014 || لحظة اسقاط برميلين من الطائرة على المدنيين .', location: {lat:36.242108, lng:37.13954}
}, {string: 'حلب نيوز:: الادارة العامة تقوم بإصلاح شبكة الكهرباء في حي الصاخور نتيجة سقوط صاروخ فيل 20-8-2015', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز::اثار الدمار نتيجة سقوط صاروخ فيل في حي الصاخور 20-8-2015', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز::حي الصاخور ::رساله من أهالي حي الصاخور الى بشار الأسد 10-3-2015', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز::حي الصاخور:شهداء وجراحى جراء سقوط برميل متفجر على الحي 10-3-2015', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز :قصف بالبراميل المتفجره على حي الصاخور واستشهاد 3 أطفال وعدد من الجراحى 20-2-2015', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز::جوله ميدانيه في مستوصف الصاخور حول المعانات في المستوصف 18-11-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز::الادراه العامه للخدمات تقوم بتصليح خط المياه الرئيسي في حي الصاخور 16-11-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز::الجبهة الأسلاميه تلقي القبض على لصوص في حي الصاخور 25-10-2014192', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز ::حي الصاخور || شهداء وجراحى جراء استهداف الطيران المروحي باص نقل وشاحنه 1-10-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز :حي الصاخور ||حريق ضخم جدا بسبب سقوط برميل متفجر على الحي 13-9-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز - الصاخور| الإدارة العامة للخدمات تقوم بإصلاح خط المياه الرئيسي في حي الصاخور 19-7-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز : اثار الدمار على حي الصاخور اثر قصف جوي على الحي 23 - 6 - 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز::جمعية إعانة المرضى الدوليه تقوم بأسعاف الجرحى ومصابين في حي الصاخور 19-6-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز::حي الصاخور \\الدفاع المدني يحاول أطفاء النار في حديقة الصاخور جراء القصف 19-6-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيو::حي الصاخور \\الطيران المروحي يلقي برميل على الحي وسقوط شهداء وجرحى 19-6-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز ::حي الصاخور ||اثار الدمار جراء القصف على الحي وكلمه للدفاع المدني 31-5-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز :الصاخور||اثار الدمار في الحي بعد القصف بالبراميل المتفجرة على الحي 27-5-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز::سقوط أكثر من عشر قذائف فوزليكا على حي الصاخور 25-5-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز::شهادة احد المدنين عن القصف الذي لحق بحي الصاخور 21-4-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز::الدفاع المدني يحاول أنقاذ الأهالي من تحت الأنقاض في حي الصاخور 21-4-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز::شاب يبكي على فراق عائلته جراء القصف على حي الصاخور 21-4-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز ::طفل من حي الصاخور يتحدث عن القصف الذي تعرض له الحي 21-4-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز::شهادة أحد المدنيين حول القصف الذي تعرض له حي الصاخور5-4-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز || الصاخور : امرأة تحاول إنقاذ زوجها من الدمار ؟!!! 2 4 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز :هام جدا +18 ضحيه وجرحا جراء قصف بابراميل على حي الصاخور 2-4-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز || الصاخور : الدمار الذي حلّ بالحي نتيجة القصف ببرميل ثاني 24 3 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز || الصاخور : الدمار الذي حلّ بالحي نتيجة القصف بالبراميل المتفجرة 24 3 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'هام اا شبكة حلب نيوز اا الدفاع المدني يستخرج أحد الأحياء من تحت أنقاض القصف على حي الصاخور 6-3-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'هام اا شبكة حلب نيوز الصاخور اا هكذا يرفع أهالي حلب أنقاض القصف بالطيران الحربي 6 3 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'هام اا شبكة حلب نيوز اا شهادة أحد المدنيين على القصف بالطيران الحربي في حي الصاخور 6 3 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز :: آثار القصف بالطيران الحربي على حي الصاخور 19-2-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'لقطات من القصف على حي الصاخور والدمار الذي خلفه القصف على الحي 11/2/2014 +18', location: {lat:36.218291, lng:37.189236}
}, {string: 'هاااام - شبكة حلب نيوز : مجزرة في حي الصاخور اثر قصف قوات النظام الحي بالبراميل المتفجرة 3-1-2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'أشلاء ماتبقى من الشهداء بعد سقوط برميل متفجر على حي الصاخور 3 / 2 /2014 +18', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز||حي الصاخور-احد المدنيين الذين خرجوا من سجون تنظيم الدولة', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز :: حي الصاخور|| الجيش النظام يستهدف الحي برشاشات عيار 23', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز :: أحد مقاتلي جبهة الصاخور يشرح عن الوضع العسكري بشكل عام', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز-اجتماع المجلس الطبي الحر في المركز الثقافي بحي الصاخور', location: {lat:36.218291, lng:37.189236}
}, {string: 'وكالة حلب نيوز - عرض رائع للأطفال ضمن حفل في المركز الثقافي بحي الصاخور 20-10-2013', location: {lat:36.218291, lng:37.189236}
}, {string: 'وكالة حلب نيوز - أنشودة رائعة لعبد الوهاب المنلا في المركز الثقافي بحي الصاخور 20-10-2013', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز-مؤسسة جنى-احتفاليات الاطفال في العيد في حي الصاخور||17-10-2012||', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز-مؤسسة جنى- جانب من حفلة الاطفال في عيد الاضحى في حي الصاخور||17-10-2013||', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حب نيوز - من فعاليات تجمع أنا سوري برعاية منظمة مرام للإغاثة في المركز الثقافي في الصاخور', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز : مؤسسة جنى تقوم بتفعيل المركز الثقافي في حي الصاخور', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز :: المجلس المحلي لمدينة حلب يقوم بحملة نظافة في حي الصاخور 23-9-2013', location: {lat:36.218291, lng:37.189236}
}, {string: 'الصاخور || الذكرى الاولى لرحيل المربي مجد سعيد نشيد " كالحلم نراه " 20 9 2013', location: {lat:36.218291, lng:37.189236}
}, {string: 'الصاخور || الذكرى الاولى لرحيل المربي مجد سعيد نشيد " أيها المسلمون " بصوت راااااااااائع', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب-الصاخور || خيمة دعوية مسابقة لكبار السن 12-9-2013', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب-الصاخور || توزيع هداية للأطفال بعد مسابقة قرأنية 12-9-2013', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز::اللحظات الاولى للقصف على حي الصاخوربالبراميل المتفجره والاضرار ماديه 28-4-2015', location: {lat:36.218291, lng:37.189236}
}, {string: 'هاااام جدااا حلب نيوز لحظة سقوط برميلين على حي مساكن هنانو والصاخور 2015/02/10', location: {lat:36.218291, lng:37.189236}
}, {string: 'هام : شبكة حلب نيوز :: لحظة إلقاء الطيران المروحي برميل على حي الصاخور على منازل المدنيين 06/02/2015', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز لحظة سقوط برميل متفجر على حي الصاخور', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز- الصاخور || اللحظات الأولى بعد القصف على الحي وصور أشلاء المدنيين 15-8-2014 +18', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز : لحظة القصف على حي الصاخور واثار الدمار 30 - 6 - 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز || الصاخور : لحظة القصف على الحي وإسعاف الجرحى 27 6 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز : لحظة القصف بالبرميل المتفجرة على دوار الصاخور 25 - 6 - 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'شبكة حلب نيوز || حي الصاخور : لحظة القصف على الحي بالبراميل 13 6 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز || الصاخور : لحظة قصف المقاتلات لحي الصاخور بالبراميل 2 4 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز || الصاخور : لحظة القصف بالطيران الحربي على الحي 1 4 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز || الصاخور : لحظة القصف على الحي بالطيران الحربي وآثار الدمار الذي حل به 19 2 2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'اللحظات الأولى بعد القصف على حي الصاخور بالبراميل ونقل الشهداء والجرحى 11/2/2014 +18', location: {lat:36.218291, lng:37.189236}
}, {string: 'هاااام :: حلب نيوز لحظة سقوط ثلاثة براميل على حي الصاخور 11/2/2014', location: {lat:36.218291, lng:37.189236}
}, {string: 'حلب نيوز::معاناة اهالي حي الصالحين من المياه نتيجة سقوط برميل متفجر على الحي 7-7-2015', location: {lat:36.188692, lng:37.164001}
}, {string: 'حلب نيوز | رصد معاناة المدنيين في تأمين المياه بحيّ الصالحين نتيجة قصف الأنابيب بالبراميل المتفجرة', location: {lat:36.188692, lng:37.164001}
}, {string: 'حلب نيوز: إنتشال أشلاء مدنيين وشهداء من بين الأنقاض في حي الصالحين لنتيجة استهدافه ببرميل متفجر', location: {lat:36.188692, lng:37.164001}
}, {string: 'حلب نيوز؛؛اضرار كبيرة في مركز طبي قصفته قوات الاسد وشهادة الكادر الطبي في حي الصالحين 14-5-2015', location: {lat:36.188692, lng:37.164001}
}, {string: 'شبكة حلب نيوز | 1-5-2015 | شهداء و جرحى و دمار في المنازل في حي الصالحين جراء قصف بالبراميل المتفجرة', location: {lat:36.188692, lng:37.164001}
}, {string: 'شبكة حلب نيوز:حي الصالحين:المجلس المحلي لمدينة حلب يقومون بتصليح الصرف الصحي31-3-2015', location: {lat:36.188692, lng:37.164001}
}, {string: 'شبكة حلب نيوز:حي الصالحين|عمال المجلس المحلي يقومون بتصليح الخط الرئيسي لصرف الصحي9-2-2015', location: {lat:36.188692, lng:37.164001}
}, {string: 'كاميرا حلب نيوز في جولة ميدانية توضح الدمار في حي الصالحين بحلب 19-12-2014', location: {lat:36.188692, lng:37.164001}
}, {string: 'هام اا شبكة حلب نيوز اا آثار القصف على حي الصالحين بالبراميل المتفجرة 3 2 2014', location: {lat:36.188692, lng:37.164001}
}, {string: 'الصالحين - أحد المتظاهرين يطالب بالكهرباء بعد انقطاع مدة طويلة 4-10-2013', location: {lat:36.188692, lng:37.164001}
}, {string: 'الصالحين - مظاهرة تطالب الجهات المعنية بإعادة الكهرباء إلى الحي 4-10-2013', location: {lat:36.188692, lng:37.164001}
}, {string: 'شبكة حلب نيوز :: الصالحين حملة تنظيف للقمامة للحي', location: {lat:36.188692, lng:37.164001}
}, {string: 'شبكة حلب نيوز :: مقتطفات من حفل تكري حفظة القرآن المقدم من "هيئة شام الإسلامية" في حي الصالحين', location: {lat:36.188692, lng:37.164001}
}, {string: 'شبكة حلب نيوز :: طالبة تشرح عن الدروس التي كانت تتلقاها قبل المسابقة في حي الصالحين', location: {lat:36.188692, lng:37.164001}
}, {string: 'شبكة حلب نيوز:: مسؤول من هيئة شام الإسلامية يتحدث عن حفل التكريم في حي الصالحين', location: {lat:36.188692, lng:37.164001}
}, {string: 'حلب-الصالحين || لقاء مع أهالي الحي يشرحون فيه معاناتهم من انقطاع الكهرباء وعدم توفرإغاثة لهم4-9-2013', location: {lat:36.188692, lng:37.164001}
}, {string: 'حلب - الصالحين : الواقع الاقتصادي الصعب حوّل الأرصفة لاسواق تجارية', location: {lat:36.188692, lng:37.164001}
}, {string: 'شبكة حلب نيوز :: تراكم القمامة على أوتسترا حي الصالحين', location: {lat:36.188692, lng:37.164001}
}, {string: 'حلب - الصالحين (شارع المغسلة ) : لحظة سقوط الصواريخ الفراغية وحالة الهلع الكبيرة (مميز)', location: {lat:36.188692, lng:37.164001}
}, {string: 'حلب نيوز::اثار الدمار نتجية سقوط برميل متفجر في حي السكري وشاهدات اهالي الحي 24-8-2015', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب نيوز::محاولة انتشال عائله من تحت الانقاض جراء سقوط برميل على حي السكري 31-5-2015', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب نيوز: آثار قصف قوات الأسد حي السكري ببرميل متفجّر على بناء سكني للمدنيين 2015/05/24', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز - حيّ السكري | آثار الدمار الذي خلفه قصف طيران قوات النظام للحيّ صباح اليوم 2015-4-15', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب نيوز::الأداره العامه للخدمات تقوم بأصلاح الكهرباء في حي السكري بعد انقطاع طويل 8-1-2015', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز : جولة توضح بعض من الدمار في حي السكري جراء قصف قوات النظام للحي 4-12-2014', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز::مجزرة حي السكري سيارات الأسعاف تقوم بنقل المصابين الى المشافي 16-6-2014', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز ::من داخل احد المشافي الميدانيه مجزرة حي السكري 16-6-2014', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب السكري || جولة ميدانية في الحي 8-3-2013', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز||حي السكري-الدفاء المدني يقوم بأطفاء النيران جراء القصف بالبراميل المتفجرة', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز||حي السكري-مابعد القصف ببرميلين متفجرين على الحي', location: {lat:36.167633, lng:37.160821}
}, {string: 'هام اا رسالة أحد المدنيين بعد القصف بالبراميل المتفجرة على حي السكري 5 3 2014', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز اا تصاعد كثيف للدخان بعد القصف بالبراميل المتفجرة على حي السكري 1 2 2014', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز||حي السكري-آثار الدمار جراء القصف بالطيران الحربي على معمل بلاستيك||24-12-2013||', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز||حي السكري-احد المدنيين يروي ماحدث اليوم بالحي من قصف ومجازر||24-12-2013||', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز||حي السكري-تقرير مصور يرصد آثار الدمار جراء القصف بالطيران الحربي ج3', location: {lat:36.167633, lng:37.160821}
}, {string: 'حي السكري-تقريرمصور يظهرآثارالدمارجراءالقصف بالطيران الحربي على مدرسة لتحفيظ القرآن الكريم', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكةحلب نيوز||حي السكري-تقرير مصوريرصد آثار الدمار جراء القصف بالطيران الحربي ج2', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكةحلب نيوز||حي السكري -تقريرمصور يرصدآثار الدمار جراء القصف بالطيران الحربي ج1', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز || قصف بالطيران الحربي على حي السكري ومحاولة عناصر الدفاع المدني إجلاء الأنقاض', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب - السكري || الإدارة الإسلاميّة تقوم بتأمين مياه الشرب للمشافي الميدانية 10-11-2013', location: {lat:36.167633, lng:37.160821}
}, {string: 'حي السكري"خروج مظاهرة من جامع ويس القرني حيت جميع الفصائل المجاهدة', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب-السكري || أغنية ثورة سوريا ثورة عزة وكرامة 13-9-2013', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب-السكري || خروج مظاهرة من جامع أويس القرني تهتف للحرية وإسقاط النظام 13-9-2013', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب-السكري || خروج مظاهرة من جامع أويس القرني تهتف للحرية وإسقاط النظام 6-9-2013', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب-السكري || خروج مظاهرة من جامع ويس القرني تنندد بمجزرة الغوطة وتتوعد النظام برد قاسي 23-8-2013', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب-السكري || خروج مظاهرة تتطالب المجتمع الدولي بمحاسبت النظام بعد ارتكابه المجازر 21-8-2013', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب-السكري هام || توجيه كلمة للمسلمين بخصوص الجهاد والتقاعس عن الجهاد 21-8-2013', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب - السكري || حفر الآبار و ذلك لتصبح المصدر الرئيس للمياه في الحيّ 18-8-2013', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز اا لحظات بعد القصف بالطيران الحربي على حي السكري 7 3 2014', location: {lat:36.167633, lng:37.160821}
}, {string: 'هام اا شبكة حلب نيوز اا لحظة القصف بالطيران الحربي على حي السكري 7 3 2014', location: {lat:36.167633, lng:37.160821}
}, {string: 'هام اا لحظات بعد القصف بالبراميل المتفجرة على حي السكري 5 3 2014', location: {lat:36.167633, lng:37.160821}
}, {string: 'هااام- شبكة حلب نيوز :: اللحظات الأولى للقصف على حي السكري ورفع الأنقاض عن المدنيين', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز اا لحظات بعد القصف على دوار السكري من طرف الأنصاري بالبراميل المتفجرة 1 2 2014', location: {lat:36.167633, lng:37.160821}
}, {string: 'شبكة حلب نيوز اا لحظات بعد القصف على حي السكري بالبراميل المتفجرة 1 2 2014', location: {lat:36.167633, lng:37.160821}
}, {string: 'حلب نيوز::اثار الدمار نتيجة سقوط برميل متفجر على حي كرم البيك 20-8-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز::استخراج الجراحى من بين الانقاض نتيجة سقوط برميل متفجر على حي الشعار 3-8-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز::اثار الدمار نتيجة سقوط برميل متفجر على حي الشعار 3-8-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'جولة لكاميرا حلب نيوز في حيّ الشعار ترصد آثار الدمار في الحيّ وحياة المدنيين فيه 6-7-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز::شهيد وعدد من الجرحى جراء سقوط قذيفة مدفعيه على حي الشعار 22-5-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز::كرم البيك:وقوع اصابات بين المدنين جراء سقوط صاروخ فيل على الحي 11-4-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز - الشعار || إصلاح خطوط الكهرباء من قبل الإدارة العامة بعد تلفها نتيجة القصف 26-2-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز - حي الشعار || آثار الدمار نتيجة استهداف الحيّ بالبراميل المتفجرة 26 2 2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز::الأداره العامه للخدمات تقوم بأصلاح الكهرباء في حي الشعار بعد القصف على الحي 26-2-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز::الشعار ::حالة غضب من أهالي الحي بسبب القصف بالبرميل من طيران النظام على الحي26-2-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز::حي الشعار ::دمار هائل جراء سقوط برميلين على الحي 26-2-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز::سقوط برميل على حي الشعار والاضرار ماديه 20-2-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز|المجلس المحلي شعبة المياه تقوم بإصلاح الخط الرئيسي للمياه في حي الشعار12-2-2015', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز::خروج مظاهره من حي الشعار طالبت بأستمرار الثوره وتوحيد الصف 19-12-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز::المجلس المحلي يقوم بأصلاح المجرور في حي الشعار 6-12-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::كرم البيك ||المجلس المحلي يقوم بصيانة الخط الأرضي في الحي 13-11-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::حي كرم البيك||شهادة إحد المدنين على قصف الطيران خي كرم البيك 8-11-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::حي الشعار ||معانات عمال النظافه في المجلس المحلي 7-11-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::شهداء وجرحى في حي الشعار نتيجة قصف البراميل على الحي 6-11-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::جزء من معانات المدارس في مناطق سيطرة الثوار في حي الشعار 3-11-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::حي الشعار ||تقرير عن إحد المررس الميدنيه في الحي 22-10-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::مجلس المدينه يقوم بتصليح الكهرباء في حي الشعار 18-10-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب-الشعار || تجمع المدنيين بمكان تواجدى شبكة الاتصلات بسبب انقطاع الشبكة 27-8-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::حي الشعار || تهدم أكثر من مينين في الحي بسبب قصف قوات النظام بالبراميل 27-8-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::حي الشعار ||أثار الدمار الكبير الذي خلفه القصف بالبراميل على الحي 23-8-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز - حي الشعار || انتشال جثة قضت تحت الأنقاض 15 يوماً 9=8-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز||حي الشعار||انتشال جثث لمدنيين قضوا 10 أيام تحت الأنقاض 7-8-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::حي الشعار أثار الدمار جراء سقوط برميل متفجر على حي الشعار صباح اليوم 5-8-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز|| حي الشعار|| آثار الدمارفي الحي بعد قصفه بالبراميل المتفجرة 3-8-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ||حي الشعار ||شهيد وجرحى أثر سقوط برميل متفجر على الحي 2-8-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز - الشعار | آثار القصف بالبراميل المتفجره على الحي وكلمة من أحد عناصر الدفاع المدني13-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:حي الشعار:الدفاع المدني يقوم برفع الانقاض من تحت الركام بعد القصف بالبراميل27-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:حي الشعار:اسعاف المصابين ودفاع المدني يقوم بإنقاذ المصابين من تحت الانقاض+18 27-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :حي الشعار:آثار الدمار في الحي ودفاع المدني يقوم بانقاذ المصابين 27-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز: حي الشعار: كلمة طفل جريح مع والده بعد سقوط برميل على منزلهم 27-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::حي الشعار :آثار الدمار في الحي بعد القصف بالبراميل المتفجرة على الحي 27-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :جولة ميدانية في حي الشعار بعد تعرض الحي لقصف بالبراميل المتفجرة 23-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::حي الشعار || كلمه لأحد عناصر الدفاع المدني 22-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::حي الشعار ||الدفاع المدني يحاول أطفاء الحريق وكلمه لأحد المدنين في الحي 22-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::حي الشعار ||سقوط صاروخ غراد على بناء مدني وأحتراق المبنى 22-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::حي الشعار اثار الدمار الذي خلفه القصف المكثف بالبراميل على الحي صباح اليوم 22-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::حي الشعار ||اب يفقد اولاده الأثنين بقصف على الحي بالبراميل مقطع ومؤثر جدا19-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز: حي الشعار :اثار الدمار واسعاف شخصين بعد سقوط برميل على الحي 19-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::حي الشعار ||جرحى وشهداء مجزرة حي الشعار 17-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ..أهالي حي الشعار يسعفوف ضحايا القصف على حي الشعار 9-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ..حي الشعار ||الطيران المروحي يستهدف الحي للمره الثاني على التوالي هذا اليوم 2-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز..حي الشعار ||الطيران المروحي يستهدف جسر الشعار ببرميل متفجر 2-7-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:حي الشعار:اثار الدمار وكلمة يوجهها المدنيين الى النظام بعد القصف بالبراميل 12-6-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:حريق احد المنازل بسبب تماس كهربائي في حي الشعار3-6-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'هاام جدااا : تحليق الطيران المروحي في أجواء مدينة حلب وإلقاء برميل على حي الشعار 2-6-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::حي الشعار ||الطيران الحربي يستهدف الحي بصاروخ والأضرار ماديه 2-6-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::حي الشعار ||الدفاع المدني يحاو أخراج ما تبقى من الضحايا من تحت الأنقاض 2-6-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::حي الشعار محاوله لاخراج الشهداء من تحت الأنقاض 1-6-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::حي الشعار ||حالة خوف شديده وجرحى وشهداء جراء سقوط برمياين 1-6-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::حي الشعار سقوط برميلين على الحي 1-6-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::الطيران المروحي يلقي برميل متفجر على مقبرة في حي الشعار 1-6-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز||حي الشعار كازية الشرق::اثار الدمار في الحي بعد القصف بالبراميل المتفجرة 31-5-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::مظاهرة في حي الشعار ج 2 :::::::::::::23-5-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::مظاهرة في حي الشعار 23-5-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:المجلس المحلي لمدينة حلب:مقابلة مع ورشة تصليح الكهرباء في حي الشعار 20-5-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::اهالي حي الشعار يشتكون من انقطاع الماء الدئم على الحي', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::المجلس المحلي يقوم بأصلاح الكهرباء في حي الشعار 7-5-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::خروج مظاهره من حي الشعار يطالبوب الجيش الحر بتوجه الى الجبهات 7-5-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::كتائب أبوعماره تقوم بتفكيك برميل لم ينفجرالقته مروخيات النظام على حي الشعار 27-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:: قصف بالبراميل المتفجره على حي الشعار خلف عدد كبير من الجرحى وشهداء 27-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ::دمار هائل جراء قصف حي الشعار بالبراميل المتفجره 27-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::اللحظه الأولي للقصف على حي الشعار بالبراميل 27-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز || كرم البيك : آثار الدمار نتيجة القصف بالبراميل المتفجرة على الحي 24 4 2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'ششبكة حلب نيوز - الدفاع المدني يحاول اطفاء الحريق في حي كرم البيك الناتج عن القصف الحربي 24-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::جثث وضاحيا مجزرة حيا طريق الباب وكرم البيك 24-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:::المجلس المحلي يقوم بصيانة الكهرباء الذي تضرر في القصف على حي الشعار 14-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز ||قصف بالبراميل المتفجره على حي الشعار 13-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:مظاهرة في حي الشعار في جمعة #انقذوا _حلب هتفت لشهداء الحي 11-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز - أحد المدنيين يوجه رسالة بعد القصف على حي الشعار 6-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'هام: حلب نيوز: الدفاع المدني ينقذ الأطفال والنساء من بين الدمار في حي الشعار 6-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز: دمار حي الشعار بالبراميل المتفجرة 6-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز || قصف بالطيران الحربي للمرة الثانية على حي الشعار 4-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز::المشهد الأول لقصف الطيران الحربي على حي الشعار4-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:ضحايه واشلاء جراء القصف على حي الشعار 4-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:أستمرار حملة التلقيح في حي الشعار الجوله الرابعه ضد شلل الاطفال1-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:قصف بطيران الحربي على حي كرم البيك 1-4-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز:جوله مع شاب من اهالي سوق سد اللوز يتحدث عن القصف الذي تعرض له الحي ويشكر قناة حلب 29-3-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:معانات اهالي واطفال حي كرم البيك جراء قصف الطيران على الحي 24-3-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز مجلس حي الشعار بتعون مع المجلس المحلي يقومون بتوزيع الأغاثه على اهالي الحي', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:قصف بطيران الحربي على حي كرم البيك والأضرار ماديه 20-3-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز رساله من احد المدنبن في حي الشعار الى بشار الأسد 18-3-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز الطيران الحربي يستهدف بصاوريخ جامع سد اللوز 18 3 2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز قصف متجدد من الطيران الحربي على سوق سد اللوز18 3 2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'هااام -شهادة المدنيين حول القصف الذي تعرض له حي سد اللوز 18-3-2014', location: {lat:36.203763, lng:37.196937}
}, {string: '18-3-2014شبكة حلب نيوز دمار هائل جراء قصف صاروخي على سوق سد اللوز', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز قصف بطيران الحربي على سوق سد اللوز 18-3-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز مظاهرة حي الشعار ج2', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز خروج مظاهره من حي الشعار ج1..17-3-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز النقطه الأمنيه تقوم بفتح طريق دوار الشعار وتزيل الأوساخ عن الطريق 16-3-2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'الدمار الذي خلفه القصف على حي الشعار بالبراميل المتفجرة 3 2 2014', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز||حي الشعار-معاناة المدنيين جراء انقطاع المياه عن الحي', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز - حي الشعار : الإدارة العامة للخدمات تقوم بصيانة الكهرباء في الحي', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز || الشعار : قصف بالبراميل المتفجرة وسقوط اكثر من 10 شهداء ولقطات من مكان المجزرة', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز||حي الشعار-آثار الدمار جراء القصف من الطيران الحربي||16-12-2013||', location: {lat:36.203763, lng:37.196937}
}, {string: 'أحتراق بسط كهرباء في حي الشعار جراء سقوط قذيفة مدفعية', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: حملة تنظيف بإسم النظافة من الإيمان بإدارة مجموعة ثمار في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:: تهدم مئذنة مسجد نور الشهداء في حي الشعار نتيجة القصف', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:: إستهداف مسجد نور الشهداء بقذائف الدبابات في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: البحث مستمر على ماتبقى من شهداء تحت الانقاض في حي كرم البيك', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز || كرم البيك : آثار الدمار الكبير نتيجة سقوط برميل متفجر - تصوير عالي - 23 11 2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:خروج مظاهرة من حي الشعار تطالب بتسمية دوار الشعار بإسم الشهيد عبد القادرالصالح', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: سقوط قذيفة على حي الشعار منطقة دوار بربانة', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز : جولة في حي الشعار يظهر فيها سوء أوضاع الأهالي في ظل انقطاع المياه و الكهرباء', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: سقوط قذيفة دبابة على أحد المنازل في حي الشعار منطقة دوار بربانة 10-11-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز-حي الشعار-رئيس مجلس الشرعي يشرح سبب اعتقاله', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: الإدارة العامة للخدمات تقوم بصيانة الاسلاك الكهرباء في حي كرم البيك', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: إتهام مباشر من المكتب الإغاثي في حي الشعار إلى جمعية أبرار حلب', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: المكتب الإغاثي في منطقة كرم البيك يقوم بتوزيع الإغاثة على سكان الحي', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز:: كلمة لمديرة إحدى المدارس في حي الشعار تشرح عن الوضع الدراسي', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: الإدارة العامة للخدمات تقوم بإصلاح الكهرباء في حي الشعار 26-9-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: مقتطفات من حفل تكريم للأطفال مقدم من لواء التوحيد في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: الإدارة الإسلامية للخدمات تقوم بتمديد اسلاك الكهرباء في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: إزدحام شديد على أحد المكاتب الإغاثية في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: المكتب الإغاثة في كرم البيك بقوم بالتوزيع الإغاثة على سكان الحي14-9-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز : مجموعة ثمار تعلن عن افتتاح التسجيل في المدارسة في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: ترحيل القمامة بمعدات أولية في حي كرم البيك', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: تصليح الكهرباء من قبل "المجلس المحلي لمدينة حلب" في كرم البيك', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: متطفات من حفل براعم السلام المقدم من "جمعية السلام الخيرية" في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: "الإدارة الإسلامية للخدمات" تقوم بتمديد أسلاك الكهرباء في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب-الشعار || سهرة ثورية لمجلس حي الشعار مع الفنان أحمد شكري 2-9-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب-طريق الباب || مقابلة مع رئيس مجلس حي كرم البيك يشرح كيفية توزيع الإغاثة 3-9-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب-الشعار || المجلس المحلي يقوم بإصلاح الكهرباء في الحي 2-9-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب-الشعار || تراكم القمامة في الحي ولا نعلم من المسؤول عن ذالك 31-8-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب-الشعار || خروج مظاهرة من جامع إبراهيم الخليل نددت بالتدخل الامريكي وبمجازر النظام 30-8-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب-الشعار || العثور على جثة لم يعرف قاتلها 30-8-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب-الشعار || ترحيل القمامة من المشافي الميدانية من قبل المجليس المحلي 27-8-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب-الشعار || مظاهرة تهتف الشعب السوري ما بينزل والشعب السوري واحد 26-8-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب-الشعار || خروج مظاهرة من جامع نور الشهداء تندد بمجازر النظام 26-8-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: مظاهرة من مسجد نور الشهداء في حي الشعار تندد مجزرة الغوطة', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: طريقة التدريس في مدرسة الشهيد عمار محمد العكر في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: كلمة مدير مدرسة الشهيد عمار محمد العكر في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز : حي الشعار || عثر على الشاب مقتول أمام أحد المشافي الميدانية', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز : حي الشعار || بسبب نقص الخدمات اطفال الحي يساهمون بترحيل القمامة', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز : حي الشعار || حفر الأبار المتواصل بسبب انقطاع المياه 14-8-2013', location: {lat:36.203763, lng:37.196937}
}, {string: 'حلب نيوز ::جولة في حي الشعار مع مجموعة ثمار في حفل للأطفال في مناسبة العيد', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز :: قناص النظام يرصد مفرق المواصلات في حي الشعار', location: {lat:36.203763, lng:37.196937}
}, {string: 'شبكة حلب نيوز : حي الشعار || أنشودة فتيات لأطفال الحفل في مسجد نور الشهداء', location: {lat:36.203763, lng:37.196937}
    }];

    AleppoMap('mainmap', mainMapQueries);
    AleppoMap('channelmap', channelQueries, {maxResults:1});
  };
})();
