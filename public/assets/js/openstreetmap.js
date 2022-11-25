var attribution = new ol.control.Attribution({ collapsible: false });

var map = new ol.Map({
    controls: ol.control.defaults(
        { attribution: false }
    ).extend([attribution]),
    layers: [new ol.layer.Tile(
        {
            source: new ol.source.OSM(
                {
                    url: 'https://tile.openstreetmap.be/osmbe/{z}/{x}/{y}.png',
                    attributions: [
                        ol.source.OSM.ATTRIBUTION, 'Tiles courtesy of <a href="https://geo6.be/">GEO-6</a>'
                    ],
                    maxZoom: 18
                }
            )
        }
    )],
    target: 'map',
    view: new ol.View(
        {
            center: ol.proj.fromLonLat(
                [3.066667, 50.633333]
            ),
            maxZoom: 18,
            zoom: 12
        }
    )
}); {% for place in places %} var layer = new ol.layer.Vector({
    source: new ol.source.Vector(
        {
            features: [new ol.Feature(
                {
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([{{ place.coordinates.0 }}, {{ place.coordinates.1 }}]))
}
)]
}
)
});
map.addLayer(layer); {% endfor %}