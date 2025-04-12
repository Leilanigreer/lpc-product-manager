import React from 'react';
import { Tooltip, Icon } from "@shopify/polaris";
import { QuestionCircleIcon } from '@shopify/polaris-icons';

const FieldTooltip = ({ content }) => {
  return (
    <Tooltip content={content}>
      <span style={{ 
        display: 'inline-flex', 
        cursor: 'pointer', 
        alignItems: 'center', 
        marginLeft: '4px' 
      }}>
        <Icon source={QuestionCircleIcon} color="subdued" />
      </span>
    </Tooltip>
  );
};

export default FieldTooltip;