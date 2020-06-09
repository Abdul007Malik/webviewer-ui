import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import onClickOutside from 'react-onclickoutside';
import classNames from 'classnames';
import getToolStylePopupPositionBasedOn from 'helpers/getToolStylePopupPositionBasedOn';
import actions from 'actions';
import selectors from 'selectors';
import core from 'core';
import defaultTool from 'constants/defaultTool';
import { Tabs, Tab, TabPanel } from 'components/Tabs';
import Button from 'components/Button';
import './StampOverlay.scss';
import ActionButton from 'components/ActionButton';

const TOOL_NAME = 'AnnotationCreateRubberStamp';
const canvasWidth = 160;
const canvasHeight = 58;


class StampOverlay extends React.Component {
  static propTypes = {
    activeToolName: PropTypes.string,
    isDisabled: PropTypes.bool,
    isOpen: PropTypes.bool,
    isActive: PropTypes.bool,
    t: PropTypes.func.isRequired,
    i18n: PropTypes.any,
    toolButtonObjects: PropTypes.object.isRequired,
    openElement: PropTypes.func.isRequired,
    closeElement: PropTypes.func.isRequired,
    closeElements: PropTypes.func.isRequired,
    dataElement: PropTypes.string.isRequired,
    toggleElement: PropTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.overlay = React.createRef();
    this.state = {
      left: 0,
      right: 'auto',
      top: 0,
      defaultAnnotations: [],
      language: props.i18n.language,
      isStampSelected: false,
      customAnnotations: [],
    };
    this.stampTool = core.getTool(TOOL_NAME);
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isOpen && this.props.isOpen) {
      this.props.closeElements([
        'viewControlsOverlay',
        'menuOverlay',
        'toolsOverlay',
        'zoomOverlay',
        'toolStylePopup',
      ]);
      this.setOverlayPosition();
      this.getDefaultRubberStamps(isLanChanged);
      this.getCustomRubberStamps(isLanChanged);
      this.stampTool.on('customRubberStampAdded', this.onCustomRubberStampAdded);
    }

    // if language changes while overlay is open we wanted update it
    const isLanChanged = this.state.language && this.props.i18n.language !== this.state.language;

    // if (prevProps.activeToolName !== this.props.activeToolName && this.props.activeToolName === TOOL_NAME) {
    //   this.setState({ isStampSelected: false });
    //   this.props.openElement('stampOverlay');
    //   this.setOverlayPosition();
    //   this.getDefaultRubberStamps(isLanChanged);
    //   this.getCustomRubberStamps(isLanChanged);
    // } else if (this.props.isOpen && isLanChanged) {
    //   this.getDefaultRubberStamps(isLanChanged);
    //   this.getCustomRubberStamps(isLanChanged);
    // }
  }
  onCustomRubberStampAdded = async annotations => {
    this.setState({ customAnnotations: [] }, () => {
      console.log('onCustomRubberStampAdded', annotations, this.state.customAnnotations);
      this.getCustomRubberStamps();
    });

  }
  handleClickOutside = e => {
    const toolStylePopup = document.querySelector('[data-element="toolStylePopup"]');
    const toolsOverlay = document.querySelector('[data-element="toolsOverlay"]');
    const isToolsOverlay = toolsOverlay?.contains(e.target);
    const header = document.querySelector('[data-element="header"]');
    const clickedToolStylePopup = toolStylePopup?.contains(e.target);
    const clickedHeader = header?.contains(e.target);
    const rubberStampToolButton = e.target.getAttribute('data-element') === this.props.dataElement;

    if (this.props.isActive) {
      this.props.toggleElement('stampOverlay');
    }

    if (!rubberStampToolButton) {
      this.props.closeElement('stampOverlay');

      if (this.props.activeToolName === TOOL_NAME &&
          !clickedToolStylePopup &&
          !clickedHeader &&
          !isToolsOverlay &&
          !this.state.isStampSelected) {
        core.setToolMode(defaultTool);
      }
    }
  }

  setOverlayPosition = () => {
    const rubberStampToolButton = document.querySelector(
      `[data-element="${this.props.dataElement}"]`,
    );

    if (rubberStampToolButton && this.overlay.current) {
      const res = getToolStylePopupPositionBasedOn(rubberStampToolButton, this.overlay);
      this.setState(res);
    }
  }

  setRubberStamp(annotation) {
    core.setToolMode(TOOL_NAME);
    this.props.closeElement('stampOverlay');
    const text = this.props.t(`rubberStamp.${annotation['Icon']}`);
    this.stampTool.setRubberStamp(annotation, text);
    this.stampTool.showPreview();

    this.setState({ isStampSelected: true });
  }

  getCustomRubberStamps = async isLanChanged => {
    if (!this.state.customAnnotations.length || isLanChanged) {
      const annotations = await this.stampTool.getCustomStampAnnotations();
      const previews = await Promise.all(
        annotations.map(annotation => {
          const text = this.props.t(`rubberStamp.${annotation['Icon']}`);

          const options = {
            canvasWidth,
            canvasHeight,
            text,
          };

          return this.stampTool.getPreview(annotation, options);
        }),
      );

      const customAnnotations = annotations.map(annotation => ({
        annotation,
        imgSrc: annotation['ImageData'],
      }));

      this.setState({ customAnnotations });
    }
  }
  getDefaultRubberStamps = async isLanChanged => {
    if (!this.state.defaultAnnotations.length || isLanChanged) {
      const annotations = this.stampTool.getDefaultStampAnnotations();
      const previews = await Promise.all(
        annotations.map(annotation => {
          const text = this.props.t(`rubberStamp.${annotation['Icon']}`);

          const options = {
            canvasWidth,
            canvasHeight,
            text,
          };

          return this.stampTool.getPreview(annotation, options);
        }),
      );

      const defaultAnnotations = annotations.map((annotation, i) => ({
        annotation,
        imgSrc: previews[i],
      }));

      this.setState({ defaultAnnotations, language: this.props.i18n.language });
    }
  }
  openCustomSampModal = () => {
    const { defaultSignatures } = this.state;
    const { openElement, closeElement } = this.props;

    // if (defaultSignatures.length < maxSignaturesCount) {
    openElement('customStampModal');
    //   closeElement('signatureOverlay');
    // }
  }
  render() {
    const { left, top, defaultAnnotations, customAnnotations } = this.state;
    const { isDisabled, isOpen } = this.props;
    if (isDisabled) {
      return null;
    }

    let imgs = null;
    let customImgs = null;
    if (isOpen) {
      imgs = defaultAnnotations.map(({ imgSrc, annotation }, index) =>
        <div key={index}
          className="rubber-stamp"
          onClick={() => this.setRubberStamp(annotation)}
        >
          <img src={imgSrc} />
        </div>,
      );

      customImgs = customAnnotations.map(({ imgSrc, annotation }, index) =>
        <div key={index}
          className="rubber-stamp"
          onClick={() => this.setRubberStamp(annotation)}
        >
          <img src={imgSrc} />
        </div>,
      );
    }
    const className = classNames({
      'Overlay': true,
      'StampOverlay': true,
      'open': isOpen,
      'closed': !isOpen,
    });

    return (
      <div
        className={className}
        ref={this.overlay}
        style={{ left, top }}
        data-element="stampOverlay"
      >

        <Tabs id="rubberStampTab">
          <div className="header">
            <div className="tab-list">
              <Tab dataElement="defaultRubberStampButton">
                <Button label={'Standard Business'} />
              </Tab>
              <Tab dataElement="customRubberStampButton">
                <Button label={'Custom Stamps'} />
              </Tab>
            </div>
          </div>

          <TabPanel dataElement="defaultRubberStamp">
            <div className="default-stamp-container">
              <div className="modal-body">
                { imgs }
              </div>
            </div>
          </TabPanel>
          <TabPanel dataElement="customRubberStamp">
            <div className="custom-stamp-container">
              {/* <div
                className={`add-custom-stamp enabled`}
                onClick={this.openCustomSampModal}
              >
                Add custom stamp
              </div> */}
              <div className="modal-body">
                { customImgs }
              </div>

            </div>
          </TabPanel>
        </Tabs>


      </div>
    );
  }
}


const mapStateToProps = state => ({
  isDisabled: selectors.isElementDisabled(state, 'stampOverlay'),
  isOpen: selectors.isElementOpen(state, 'stampOverlay'),
  activeToolName: selectors.getActiveToolName(state),
  isActive: selectors.getActiveToolName(state) === TOOL_NAME,
  toolButtonObjects: selectors.getToolButtonObjects(state),
  dataElement: selectors.getToolButtonObjects(state)[TOOL_NAME].dataElement,
});

const mapDispatchToProps = {
  closeElements: actions.closeElements,
  closeElement: actions.closeElement,
  openElement: actions.openElement,
  toggleElement: actions.toggleElement,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withTranslation()(onClickOutside(StampOverlay)));
