import React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import styled from 'styled-components';
import Modal from '@material-ui/core/Modal';
import moment from 'moment';
import { AttrbuteDataType } from 'conseiljs';
import { ArronaxIcon } from '../ArronaxIcon';
import Loader from '../Loader';
import { formatNumber } from '../../utils/general';

const ScrollContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 77px 0;
`;

const ModalContainer = styled.div`
  background-color: #ffffff;
  outline: none;
  position: relative;
  padding: 27px 30px 30px 30px;
  margin: 0 auto;
  width: 798px;
  min-height: 100%;
`;

const ListContainer = styled.div`
  width: 100%;
`;

const CloseIcon = styled(ArronaxIcon)`
  cursor: pointer;
  position: absolute;
  top: 30px;
  right: 30px;
`;

const ModalTitle = styled.div`
  padding: 0 0 19px 0;
  font-size: 24px;
  line-height: 28px;
  font-weight: 400;
  color: #9b9b9b;
  text-transform: capitalize;
`;

const RowContainer = styled.div`
  display: flex;
  padding: 15px 0;
  font-size: 16px;
  line-height: 19px;
  border-bottom: 1px solid #dcdcdc;
  letter-spacing: 0.23px;
  color: rgb(74, 74, 74);
`;

const TitleTxt = styled.div`
  width: 198px;
  font-weight: 400;
`;

const ContentTxt = styled.div`
  font-weight: 300;
  word-break: break-word;
  flex: 1;
`;

const ButtonContainer = styled.div`
  display: flex;
  padding: 15px;
  justify-content: flex-end;
`;

const CloseButton = styled.div`
  color: #56c2d9;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
`;

type OwnProps = {
  open: boolean;
  item: any;
  attributes: any[];
  isLoading: boolean;
  title: string;
  onClose: () => void;
};

type Props = OwnProps & WithTranslation;

class EntityModal extends React.Component<Props, {}> {
  onClickModal = (event: any) => {
    event.stopPropagation();
  }
  render() {
    const { open, item, attributes, isLoading, onClose, title, t } = this.props;

    const formattedValues = attributes
      .filter(c => item[c.name] != null && item[c.name] !== undefined)
      .sort((a, b) => {
          if (a.displayOrder === undefined && b.displayOrder === undefined) {
              if(a.displayName < b.displayName) { return -1; }
              if(a.displayName > b.displayName) { return 1; }
          }

          if (a.displayOrder === undefined && b.displayOrder !== undefined){
              return 1;
          }

          if (a.displayOrder !== undefined && b.displayOrder === undefined){
              return -1;
          }

          return a.displayOrder - b.displayOrder;
      })
      .map(c => {
          let v = {displayName: c.displayName, value: undefined, name: c.name, entity: c.entity};
          if (c.dataType === AttrbuteDataType.DATETIME && c.dataFormat) {
              v['value'] = moment(item[c.name]).format(c.dataFormat);
          } else if (c.dataType === AttrbuteDataType.DECIMAL || c.dataType === AttrbuteDataType.INT || c.dataType === AttrbuteDataType.CURRENCY) {
              v.value = formatNumber(Number(item[c.name]), c);
          } else if (c.dataType === AttrbuteDataType.BOOLEAN) {
              v.value = item[c.name].toString();
              v.value = v.value.charAt(0).toUpperCase() + v.value.substring(1);
          } else {
              v.value = item[c.name].toString();
              if (v.value.length > 0 && c.cardinality && c.cardinality < 20) {
                  v.value = v.value.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');
              }
          }

          return v;
      });

    return (
      <Modal open={open}>
        <ScrollContainer onClick={onClose}>
          <ModalContainer onClick={(event) => this.onClickModal(event)}>
            <CloseIcon onClick={onClose} size="19px" color="#9b9b9b" iconName="icon-close" />
            <ModalTitle>{t('components.entityModal.details', {title})}</ModalTitle>
              {!isLoading && (
                <ListContainer>
                  {formattedValues.map((item, index) => {
                    const { displayName, value, entity, name } = item;
                    return (
                      <RowContainer key={index}>
                        <TitleTxt>{t(`attributes.${entity}.${name}`)}</TitleTxt>
                        <ContentTxt>{value}</ContentTxt>
                      </RowContainer>
                    );
                  })}
                  <ButtonContainer>
                    <CloseButton onClick={onClose}>
                      {t('general.verbs.close')}
                    </CloseButton>
                  </ButtonContainer>
                </ListContainer>
              )}
              {isLoading && <Loader />}
          </ModalContainer>
        </ScrollContainer>
        
      </Modal>
    );
  }
};

export default withTranslation()(EntityModal);
