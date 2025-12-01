import { useState, useEffect } from 'react';
import { components } from './gallery.config';
import './App.css';

function App() {
  const [activeComponentIndex, setActiveComponentIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  
  // Dynamic state for controls
  const [componentState, setComponentState] = useState({});

  const activeComponentData = components[activeComponentIndex];
  const ActiveComponent = activeComponentData.component;

  // Initialize state when component changes
  useEffect(() => {
    setComponentState(activeComponentData.defaultProps);
  }, [activeComponentIndex]);

  const handleControlChange = (name, value, type) => {
    let newValue = value;
    if (type === 'number' || type === 'range') {
      newValue = Number(value);
    }
    setComponentState(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  // Merge default props with current state
  const activeProps = {
    ...activeComponentData.defaultProps,
    ...componentState
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${showSidebar ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>React Gallery</h2>
          <button className="toggle-btn" onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? '«' : '»'}
          </button>
        </div>
        {showSidebar && (
          <ul className="component-list">
            {components.map((comp, index) => (
              <li
                key={index}
                className={index === activeComponentIndex ? 'active' : ''}
                onClick={() => setActiveComponentIndex(index)}
              >
                {comp.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="component-viewer">
          <ActiveComponent {...activeProps} />
        </div>
        
        {/* Customization Panel */}
        <div className="customization-panel">
          <h3>Customize</h3>
          
          {activeComponentData.controls && activeComponentData.controls.map(control => (
            <div className="control-group" key={control.name}>
              <label>
                {control.label} 
                {control.type !== 'checkbox' && control.type !== 'text' && <span className="value">{activeProps[control.name]}</span>}
              </label>
              {control.type === 'checkbox' ? (
                <input 
                  type="checkbox" 
                  checked={activeProps[control.name] || false} 
                  onChange={(e) => handleControlChange(control.name, e.target.checked, 'checkbox')} 
                />
              ) : (
                <input 
                  type={control.type} 
                  min={control.min} 
                  max={control.max} 
                  step={control.step} 
                  value={activeProps[control.name] || ''} 
                  onChange={(e) => handleControlChange(control.name, e.target.value, control.type)} 
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
