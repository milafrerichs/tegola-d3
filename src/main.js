import {VectorTile} from '@mapbox/vector-tile';
import Pbf from 'pbf';
import * as d3Geo from 'd3-geo'
import * as d3Tile from 'd3-tile'
import * as d3Request from 'd3-request'
import * as d3 from 'd3'

var pi = Math.PI,
    tau = 2 * pi;

var width = Math.max(960, window.innerWidth),
    height = Math.max(500, window.innerHeight);

// Initialize the projection to fit the world in a 1×1 square centered at the origin.
var projection = d3.geoMercator()
    .scale(1 / tau)
    .translate([0, 0]);

var path = d3.geoPath()
    .projection(projection);

var tile = d3Tile.tile()
    .size([width, height]);

var zoom = d3.zoom()
    .scaleExtent([1 << 20, 1 << 23])
    .on("zoom", zoomed);

var map = d3.select("body").append("div")
    .attr("class", "map")
    .style("width", width + "px")
    .style("height", height + "px")
    .on("mousemove", mousemoved);

var layer = map.append("div")
    .attr("class", "layer");

var info = map.append("div")
    .attr("class", "info");

var center = projection([-117.15117725013909, 32.72269876352742]);

// Apply a zoom transform equivalent to projection.{scale,translate,center}.
map .call(zoom)
    .call(zoom.transform, d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(1 << 20)
        .translate(-center[0], -center[1]));

function zoomed() {
  var transform = d3.event.transform;

  var tiles = tile
      .scale(transform.k)
      .translate([transform.x, transform.y])
      ();

  projection
      .scale(transform.k / tau)
      .translate([transform.x, transform.y]);

  var image = layer
      .style("transform", stringify(tiles.scale, tiles.translate))
    .selectAll(".tile")
    .data(tiles, function(d) { return d; });

  image.exit()
      .remove();

  image.enter().append("svg")
      .attr("class", "tile")
      .style("left", function(d) { return d.x * 256 + "px"; })
      .style("top", function(d) { return d.y * 256 + "px"; })
      .each(function(d) { window._xhr = render(d, this); });
}

function render(d, node) {
		var svg = d3.select(node);
    var k = Math.pow(2, d.z) * 256; // size of the world in pixels
    window._xhr = d3Request.request("https://tegola.mojodna.net/maps/osm/" + d.z + "/" + d.x + "/" + d.y + ".pbf").responseType('arraybuffer').get(function(error, json) {
      var tile = new VectorTile( new Pbf( new Uint8Array(json.response) ) );
      var extents = 4096;
      var data = {};
      var features = [];
      for (var key in tile.layers) {
        var layer = tile.layers[key];
        var featureLength = layer.length;
        for(var i = 0; i< featureLength; i++) {
          var geojson = layer.feature(i).toGeoJSON(d.x,d.y,d.z);
          geojson.properties.layerName = key;
          features.push(geojson);
        }
      }
      d3.select(node).selectAll("path")
        .data(features)
        .enter().append("path")
          .attr("class", function(d) { return d.properties.layerName; })
          .attr("d", d3.geoPath()
              .projection(d3.geoMercator()
                  .scale(k / tau)
                  .translate([k / 2 - d.x * 256, k / 2 - d.y * 256])
                  .precision(0)));
    });
}

function stringify(scale, translate) {
  var k = scale / 256, r = scale % 1 ? Number : Math.round;
  return "matrix3d(" + [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, r(translate[0] * scale), r(translate[1] * scale), 0, 1 ] + ")";
}

function mousemoved() {
  info.text(formatLocation(projection.invert(d3.mouse(this)), d3.zoomTransform(this).k));
}

function formatLocation(p, k) {
  var format = d3.format("." + Math.floor(Math.log(k) / 2 - 2) + "f");
  return (p[1] < 0 ? format(-p[1]) + "°S" : format(p[1]) + "°N") + " "
       + (p[0] < 0 ? format(-p[0]) + "°W" : format(p[0]) + "°E");
}
