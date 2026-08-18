import React from 'react';
import Toolbar from './components/Toolbar.jsx';
import MediaLibrary from './components/MediaLibrary.jsx';
import PreviewPlayer from './components/PreviewPlayer.jsx';
import Timeline from './components/Timeline.jsx';
import PropertiesPanel from './components/PropertiesPanel.jsx';

export default function App() {
  return (
    <div className="app">
      <Toolbar />
      <div className="main-row">
        <MediaLibrary />
        <PreviewPlayer />
        <PropertiesPanel />
      </div>
      <Timeline />
    </div>
  );
}
