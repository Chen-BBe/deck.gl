// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Deck, _GlobeView as GlobeView, MapView} from '@deck.gl/core';
import {GeoJsonLayer, ArcLayer, ColumnLayer, BitmapLayer, PathLayer} from '@deck.gl/layers';
import {
  CompassWidget,
  ZoomWidget,
  FullscreenWidget,
  DarkGlassTheme,
  LightGlassTheme
} from '@deck.gl/widgets';
import '@deck.gl/widgets/stylesheet.css';
import {LayerListWidget} from './layer-list-widget';

const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
const widgetTheme = prefersDarkScheme.matches ? DarkGlassTheme : LightGlassTheme;

// source: Natural Earth http://www.naturalearthdata.com/ via geojson.xyz
const COUNTRIES =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson'; //eslint-disable-line
const AIR_PORTS =
  'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_10m_airports.geojson';
// source: https://commons.wikimedia.org/wiki/File:PathfinderMap_hires_(4996917742).jpg
const WORLD_MAP = './map.jpg';

const INITIAL_VIEW_STATE = {
  latitude: 51.47,
  longitude: 0.45,
  zoom: 0
};

const GRATICULES = getGraticules(30);

export const deck = new Deck({
  views: [
    new GlobeView({id: 'globe', width: '50%', x: '50%', controller: {minZoom: -2}}), // why does the bitmap only work when globe is first?
    new MapView({id: 'map', width: '50%', controller: true})
  ],
  initialViewState: INITIAL_VIEW_STATE,
  // controller: true, // why doesn't this enable controller on all views?
  parameters: {
    cull: true
  },
  layers: [
    new BitmapLayer({
      id: 'base-map-raster',
      image: WORLD_MAP,
      bounds: [-180, -90, 180, 90]
    }),
    new PathLayer({
      id: 'graticules',
      data: GRATICULES,
      getPath: d => d,
      widthMinPixels: 1,
      getColor: [128, 128, 128]
    }),
    new GeoJsonLayer({
      id: 'base-map',
      data: COUNTRIES,
      // Styles
      stroked: true,
      filled: true,
      lineWidthMinPixels: 2,
      opacity: 0.4,
      getLineColor: [60, 60, 60],
      getFillColor: [200, 200, 200]
    }),
    new ColumnLayer({
      id: 'airports-extruded',
      data: AIR_PORTS,
      dataTransform: geojson => geojson.features,
      // Styles
      radius: 10000,
      extruded: true,
      getPosition: f => f.geometry.coordinates,
      getElevation: f => f.properties.scalerank * 100000,
      getFillColor: [200, 0, 80, 180]
    }),
    new GeoJsonLayer({
      id: 'airports',
      data: AIR_PORTS,
      // Styles
      filled: true,
      pointRadiusMinPixels: 2,
      pointRadiusScale: 2000,
      getPointRadius: f => 11 - f.properties.scalerank,
      getFillColor: [200, 0, 80, 180],
      // Interactive props
      pickable: true,
      autoHighlight: true,
      onClick: info =>
        // eslint-disable-next-line
        info.object && alert(`${info.object.properties.name} (${info.object.properties.abbrev})`)
    }),
    new ArcLayer({
      id: 'arcs',
      data: AIR_PORTS,
      dataTransform: d => d.features.filter(f => f.properties.scalerank < 4),
      // Styles
      getSourcePosition: f => [-0.4531566, 51.4709959], // London
      getTargetPosition: f => f.geometry.coordinates,
      getSourceColor: [0, 128, 200],
      getTargetColor: [200, 0, 80],
      getWidth: 1
    })
  ],
  widgets: [
    new ZoomWidget({id: 'map-zoom', style: widgetTheme, viewId: 'map'}),
    new ZoomWidget({
      id: 'globe-zoom',
      style: widgetTheme,
      orientation: 'horizontal',
      viewId: 'globe'
    }),
    new ZoomWidget({style: widgetTheme, placement: 'bottom-right'}),
    new CompassWidget({id: 'map-compass', style: widgetTheme, viewId: 'map'}),
    new CompassWidget({id: 'globe-compass', style: widgetTheme, viewId: 'globe'}),
    new CompassWidget({style: widgetTheme, placement: 'bottom-right'}),

    new FullscreenWidget(), // TODO: should viewId be on all widgets for multi-view placement?
    new FullscreenWidget({id: 'themed', style: widgetTheme}),
    new FullscreenWidget({id: 'purple', className: 'purple', placement: 'top-right'}),
    new LayerListWidget({style: widgetTheme}),
    new LayerListWidget({style: widgetTheme, viewId: 'globe'})
  ]
});

function getGraticules(resolution) {
  const graticules = [];
  for (let lat = 0; lat < 90; lat += resolution) {
    const path1 = [];
    const path2 = [];
    for (let lon = -180; lon <= 180; lon += 90) {
      path1.push([lon, lat]);
      path2.push([lon, -lat]);
    }
    graticules.push(path1);
    graticules.push(path2);
  }
  for (let lon = -180; lon < 180; lon += resolution) {
    const path = [];
    for (let lat = -90; lat <= 90; lat += 90) {
      path.push([lon, lat]);
    }
    graticules.push(path);
  }
  return graticules;
}

// For automated test cases
/* global document */
document.body.style.margin = '0px';
