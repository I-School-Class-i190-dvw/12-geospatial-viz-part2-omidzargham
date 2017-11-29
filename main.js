// we want the whole window viewport
// if smaller laptop, just use those dimensions
var width= Math.max(960, window.innerWidth),
	height= Math.max(500, window.innerHeight);

// convinience variables for later
var pi = Math.PI,
	tau = 2 * pi;

// the projection we are ging to use for our map
var projection = d3.geoMercator()
// default projection setting 
	.scale(1 / tau)
	.translate([0,0]);

// pass in the projection into our geopath
var path = d3.geoPath()
	.projection(projection);

var tile = d3.tile()
	.size([width, height]);

// bitwise operators
// bits get shifted over two places
// scaleextent is for our tile zooming min and max
var zoom = d3.zoom()
	.scaleExtent([
		1 << 11,
		1 << 24
	])
	.on('zoom', zoomed);

// earthquake with largest magnitude will have radius of 10
// smalest will have radius of 0
var radius = d3.scaleSqrt().range([0,10]);

//adding our svg element 
var svg = d3.select('body')
	.append('svg')
	.attr('width', width)
	.attr('height', height);

var raster = svg.append('g');

// this is going to be different from previous classes
// because we are going to draw all elements to a single path element
// one path loads much quicker, but the data points
// can't be distinguished 
var vector = svg.selectAll('path');

// go through our dataset and read the data 
// putting the data in the geojson data structure
d3.json('data/earthquakes_4326_cali.geojson', function(error, geojson) {
	if (error) throw error;

	console.log(geojson);

	// set the domain for the radius of the data points 
	radius.domain([0, d3.max(geojson.features, function(d) { return d.properties.mag; })]);

	path.pointRadius(function(d) {
    return radius(d.properties.mag);
  });

	// bind the data to our single path 
	vector = vector
    .data(geojson.features)
    .enter().append('path')
    .attr('d', path)
    .on('mouseover', function(d) { console.log(d); });

	// set map projection to center of california
	// lon, lat
	var center = projection([-119.665, 37.414]);

	// call zoom transform on svg element
	svg.call(zoom)
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(1 << 14)
        .translate(-center[0], -center[1])
    );
});


// sets up zoom handler on svg element
function zoomed() {
	// transform event of how much was zoomed
	var transform = d3.event.transform;

	// update our tiles to the parameter event
	var tiles = tile
		.scale(transform.k)
		.translate([transform.x, transform.y])
		();

	// tranform.x and transform.y 
	projection
		.scale(transform.k / tau)
		.translate([transform.x, transform.y]);

	vector.attr('d', path);

	var image = raster
    .attr('transform', stringify(tiles.scale, tiles.translate))
    .selectAll('image')
    .data(tiles, function(d) { return d; });
  
  //going through the general update pattern
  image.exit().remove();
  
  // adds the image with the tiles
  image.enter().append('image')
    .attr('xlink:href', function(d) {
      return 'http://' + 'abc'[d[1] % 3] + '.basemaps.cartocdn.com/rastertiles/voyager/' +
        d[2] + "/" + d[0] + "/" + d[1] + ".png";
    })
    .attr('x', function(d) { return d[0] * 256; })
    .attr('y', function(d) { return d[1] * 256; })
    .attr('width', 256)
    .attr('height', 256);
}
//concatenation of tiles, scales and translations
function stringify(scale, translate) {
  var k = scale / 256,
      r = scale % 1 ? Number : Math.round;
  return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")";
}