import React, { useEffect } from 'react';
import classNames from 'classnames';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import actions from 'actions';
import selectors from 'selectors';

import './ProgressModal.scss';

const ProgressModal = () => {
  const [isDisabled, isOpen, loadingProgress] = useSelector(
    state => [
      selectors.isElementDisabled(state, 'progressModal'),
      selectors.isElementOpen(state, 'progressModal'),
      selectors.getLoadingProgress(state),
    ],
    shallowEqual,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (isOpen) {
      dispatch(
        actions.closeElements([
          'signatureModal',
          'printModal',
          'errorModal',
          'loadingModal',
          'passwordModal',
        ]),
      );
    }
  }, [dispatch, isOpen]);

  return isDisabled ? null : (
    <div
      className={classNames({
        Modal: true,
        ProgressModal: true,
        open: isOpen,
        closed: !isOpen,
      })}
      data-element="progressModal"
    >
      <div className="container">
        <div className="progress-bar-wrapper">
          <div
            className="progress-bar"
            style={{
              transform: `translateX(${-(1 - loadingProgress) * 100}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressModal;
