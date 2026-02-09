import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLinkType } from '../store/diagramSlice';
import type { LinkType } from '../store/diagramSlice';
import './LinkSelector.css';

export const LinkSelector = () => {
  const dispatch = useAppDispatch();
  const selectedLinkType = useAppSelector((state) => state.diagram.selectedLinkType);

  const handleLinkTypeChange = (type: LinkType) => {
    dispatch(setLinkType(type));
  };

  return (
    <div className="link-selector-container">
      <h2>Link Type</h2>
      <div className="link-type-buttons">
        <button
          className={`link-type-button ${selectedLinkType === 'link' ? 'active' : ''}`}
          onClick={() => handleLinkTypeChange('link')}
        >
          <div className="link-preview link-style">
            <div className="link-line" />
            <div className="link-arrow" />
          </div>
          <span>Link</span>
        </button>
        
        <button
          className={`link-type-button ${selectedLinkType === 'flow' ? 'active' : ''}`}
          onClick={() => handleLinkTypeChange('flow')}
        >
          <div className="link-preview flow-style">
            <div className="flow-line" />
            <div className="flow-arrow" />
          </div>
          <span>Flow</span>
          <small>(from Stock only)</small>
        </button>
      </div>
    </div>
  );
};

