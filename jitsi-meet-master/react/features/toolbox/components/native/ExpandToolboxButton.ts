import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { openSheet } from '../../../base/dialog/actions';
import { OVERFLOW_MENU_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconArrowUp, IconDotsHorizontal } from '../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import ToolboxButtonWithIcon from '../../../base/toolbox/components/web/ToolboxButtonWithIcon';
import styles from '../../../toolbox/components/native/styles' 
import Toolbox from '../../../toolbox/components/native/Toolbox';


/**
 * An implementation of a button for showing the {@code ExpandToolbox}.
 */
class ExpandToolboxButton extends AbstractButton<AbstractButtonProps> {
    accessibilityLabel = 'toolbar.accessibilityLabel.moreActions';
    icon = IconArrowUp;
    label = 'toolbar.moreActions';

    /**
     * Handles clicking / pressing this {@code OverflowMenuButton}.
     *
     * @protected
     * @returns {void}
     */
    _handleClick() {
        //this.props.dispatch(openSheet(ExpandToolbox));
        console.log('展開/縮起 toolbox')
    }


}

/**
 * Maps (parts of) the redux state to the associated props for the
 * {@code OverflowMenuButton} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: IReduxState) {
    const enabledFlag = getFeatureFlag(state, OVERFLOW_MENU_ENABLED, true);

    return {
        visible: enabledFlag
    };
}

export default translate(connect(_mapStateToProps)(ExpandToolboxButton));
