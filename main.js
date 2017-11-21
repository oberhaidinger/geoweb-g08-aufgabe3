// alert('Hello visitor!');

import 'ol/ol.css';
import 'javascript-autocomplete/auto-complete.css';
import Map from 'ol/map';
import View from 'ol/view';
import TileLayer from 'ol/layer/tile';
import Stamen from 'ol/source/stamen';
import VectorLayer from 'ol/layer/vector';
import VectorSource from 'ol/source/vector';
import GeoJSON from 'ol/format/geojson';
import Style from 'ol/style/style';
import Text from 'ol/style/text';
import Stroke from 'ol/style/stroke';
import proj from 'ol/proj';
import {apply} from 'ol-mapbox-style';
import AutoComplete from 'javascript-autocomplete';
import Vector from 'ol/source/vector'; // hamma schon in VectorLayer importiert?? Definiert wo?
import IconStyle from 'ol/style/icon'; // benötigt??
import Feature from 'ol/feature'; // benötigt??
import Point from 'ol/geom/point'; // benötigt??

const map = new Map({
  target: 'map',
  view: new View({
    center: proj.fromLonLat([16.37, 48.2]),
    zoom: 13
  })
});
map.addLayer(new TileLayer({
  source: new Stamen({
    layer: 'watercolor'
  })
}));

const layer = new VectorLayer({ //fügt Punkte aus dem map.geojson File hinzu (dort definiert)
  source: new Vector({
    url: 'data/map.geojson',
    format: new GeoJSON()
  })
});
map.addLayer(layer);

layer.setStyle(function(feature) { //fügt den Punkten Beschriftung hinzu (in map.geojson definitier)
  return new Style({
    text: new Text({
      text: feature.get('name'),
      font: 'Bold 14pt Verdana',
      stroke: new Stroke({
        color: 'white',
        width: 3
      })
    })
  });
});

function fit() {
  map.getView().fit(source.getExtent(), {
    maxZoom: 15,
    duration: 250
  });
}

var selected;
function getAddress(feature) {
  var properties = feature.getProperties();
  return (
    (properties.city || properties.name || '') +
    ' ' +
    (properties.street || '') +
    ' ' +
    (properties.housenumber || '')
  );
}

var searchResult = new VectorLayer({
  zIndex: 9999
});

searchResult.setStyle(new Style({
  image: new IconStyle({
    scale: 0.75,
    opacity: 0.9,
    src: './data/mark1.png'
  })
}));

map.addLayer(searchResult);

var onload, source;
new AutoComplete({
  selector: 'input[name="q"]',
  source: function(term, response) {
    if (onload) {
      source.un('change', onload);
    }
    searchResult.setSource(null);
    source = new VectorSource({
      format: new GeoJSON(),
      url: 'https://photon.komoot.de/api/?q=' + term
    });
    onload = function(e) {
      var texts = source.getFeatures().map(function(feature) {
        return getAddress(feature);
      });
      response(texts);
      fit();
    };
    source.once('change', onload);
    searchResult.setSource(source);
  },
  onSelect: function(e, term, item) {
    selected = item.getAttribute('data-val');
    source.getFeatures().forEach(function(feature) {
      if (getAddress(feature) !== selected) {
        source.removeFeature(feature);
      }
    });
    fit();
  }
});
