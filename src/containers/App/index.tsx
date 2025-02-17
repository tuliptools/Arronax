import React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { RouteProps, withRouter } from 'react-router-dom';
import styled from 'styled-components';
import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import HTML5Backend from 'react-dnd-html5-backend';
import { DragDropContext } from 'react-dnd';
import { EntityDefinition } from 'conseiljs';
import Header from '../../components/Header';
import SettingsPanel from '../../components/SettingsPanel';
import Footer from '../../components/Footer';
import Toolbar from '../../components/Toolbar';
import CustomTable from '../CustomTable';
import ConfigModal from '../../components/ConfigModal';
import EntityModal from '../../components/EntityModal';
import Loader from '../../components/Loader';

import {
  getLoading,
  getConfigs,
  getSelectedConfig,
  getEntity,
  getItems,
  getIsFullLoaded,
  getFilterCount,
  getColumns,
  getEntities,
  getAggregations,
  getAttributesAll
} from '../../reducers/app/selectors';
import { getErrorState, getMessageTxt } from '../../reducers/message/selectors';
import {
  changeNetwork,
  initLoad,
  submitQuery,
  exportCsvData,
  shareReport,
  changeTab,
  searchByIdThunk
} from '../../reducers/app/thunks';
import { removeAllFiltersAction, addConfigAction, removeConfigAction } from '../../reducers/app/actions';
import { clearMessageAction } from '../../reducers/message/actions';

import { ToolType, Config } from '../../types';
import octopusSrc from '../../assets/sadOctopus.svg';

const Container = styled.div`
  padding: 50px 0;
  min-height: calc(100vh - 405px);
`;

const MainContainer = styled.div`
  position: relative;
  min-height: 100vh;
`;

const TabContainer = styled.div`
  padding: 0px 15px;
  width: 100%;
`;

const NoResultContainer = styled.div`
  width: 100%;
  padding-top: 67px;
  display: flex;
  justify-content: center;
`;

const OctopusImg = styled.img`
  height: 183px;
  width: 169px;
`;

const NoResultContent = styled.div`
  margin-left: 38px;
  padding-top: 16px;
`;

const NoResultTxt = styled.div`
  color: rgb(42, 57, 115);
  font-size: 28px;
  font-weight: 500;
  line-height: 30px;
`;

const TryTxt = styled.div`
  color: rgb(155, 155, 155);
  font-size: 18px;
  font-weight: 500;
  line-height: 21px;
  margin-top: 8px;
`;

const ButtonContainer = styled.div`
  display: flex;
  margin-top: 24px;
`;

const CustomButton = styled.div`
  cursor: pointer;
  border-radius: 9px;
  height: 42px;
  width: 158px;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
`;

const ClearButton = styled(CustomButton)`
  border: 2px solid rgb(0, 196, 220);
  color: rgb(0, 196, 220);
`;

const TryButton = styled(CustomButton)`
  color: white;
  background: rgb(86, 194, 217);
  margin-left: 22px;
`;

const DismissButton = styled(CustomButton)`
  color: white;
  background: rgb(86, 194, 217);
`;

const TabsWrapper = withStyles({
  root: {
    borderBottom: 'none',
  },
  indicator: {
    backgroundColor: '#a6dfe2',
    height: '5px'
  },
})(Tabs);

const TabWrapper = withStyles({
  root: {
    textTransform: 'capitalize',
    padding: 0,
    minWidth: '50px',
    fontWeight: 300,
    color: '#2e3b6c',
    fontSize: '24px',
    letterSpacing: '3px',
    maxWidth: '500px',
    marginRight: '50px',
    '&$selected': {
      fontWeight: 'normal',
    },
  },
  selected: {},
})(Tab);

interface OwnProps {
  isLoading: boolean;
  configs: Config[];
  selectedConfig: Config;
  selectedEntity: string;
  items: object[];
  isFullLoaded: boolean;
  filterCount: number;
  aggCount: number;
  selectedColumns: EntityDefinition[];
  entities: EntityDefinition[];
  isError: boolean;
  message: string;
  attributes: any;
  removeAllFilters: (entity: string) => void;
  changeNetwork(config: Config): void;
  changeTab: (type: string) => void;
  initLoad: (e: string | null, q: string | null) => void;
  submitQuery: () => void;
  exportCsvData: ()=> void;
  shareReport: ()=> void;
  initMessage: ()=> void;
  addConfig: (config: Config, isUse: boolean) => void;
  removeConfig: (index: number) => void;
  searchById: (id: string | number) => any;
}

interface States {
  isSettingCollapsed: boolean;
  selectedTool: string;
  isModalUrl: boolean;
  isOpenConfigMdoal: boolean;
  isOpenEntityModal: boolean;
  searchedEntity: string;
  searchedItem: any;
}

type Props = OwnProps & RouteProps & WithTranslation;

class Arronax extends React.Component<Props, States> {
  static defaultProps: any = {
    items: []
  };
  settingRef: any = null;
  tableRef = null;
  constructor(props: Props) {
    super(props);
    this.state = {
      isSettingCollapsed: false,
      selectedTool: ToolType.FILTER,
      isModalUrl: false,
      isOpenConfigMdoal: false,
      isOpenEntityModal: false,
      searchedEntity: '',
      searchedItem: {}
    };

    this.settingRef = React.createRef();
    this.tableRef = React.createRef();
  }

  componentDidMount() {
    const { initLoad, location } = this.props;
    if (location) {
      const search = new URLSearchParams(location.search);
      const modal = search.get('m');
      if (modal && modal === 'true') { this.setState({isModalUrl: true}); }
      initLoad(search.get('e'), search.get('q'));
    } else {
      initLoad('', '');
    }
  }

  onChangeNetwork = (config: Config) => {
    const { changeNetwork } = this.props;
    changeNetwork(config);
  };

  onChangeTab = async (value: string) => {
    const { changeTab } = this.props;
    await changeTab(value);
    this.settingRef.current.onChangeHeight();
  };

  onChangeTool = async (tool: string) => {
    const { isSettingCollapsed, selectedTool } = this.state;
    if (isSettingCollapsed && selectedTool !== tool) {
      this.setState({ selectedTool: tool });
    } else if (!isSettingCollapsed && selectedTool !== tool) {
      this.setState({ isSettingCollapsed: !isSettingCollapsed, selectedTool: tool });
    } else {
      this.setState({ isSettingCollapsed: !isSettingCollapsed });
    }
  }

  onSettingCollapse = () => {
    const { isSettingCollapsed } = this.state;
    this.setState({ isSettingCollapsed: !isSettingCollapsed });
  };

  onCloseFilter = () => {
    this.setState({ isSettingCollapsed: false });
  };

  onResetFilters = () => {
    const {
      removeAllFilters,
      selectedEntity
    } = this.props;
    removeAllFilters(selectedEntity);
  };

  onSubmit = async () => {
    const { submitQuery } = this.props;
    this.onCloseFilter();
    await submitQuery();
  };

  onClearFilter = async () => {
    const {
      removeAllFilters,
      selectedEntity,
      submitQuery
    } = this.props;
    await removeAllFilters(selectedEntity);
    await submitQuery();
  }

  onExportCsv = async () => {
    const { exportCsvData } = this.props;
    exportCsvData();
  }

  onShareReport = () => {
    const { shareReport } = this.props;
    shareReport();
  }

  handleErrorClose = () => {
    const { initMessage } = this.props;
    initMessage();
  }

  closeConfigModal = () => this.setState({isOpenConfigMdoal: false});

  openConfigModal = () => this.setState({isOpenConfigMdoal: true});

  onAddConfig = (config: Config, isUse: boolean) => {
    const { addConfig } = this.props;
    addConfig(config, isUse);
    this.closeConfigModal();
  }

  onSearchById = async (val: string | number) => {
    const { searchById } = this.props;
    const realVal = !Number(val) ? val : Number(val);
    const { entity, items } = await searchById(realVal);
    if (items.length > 0 && entity) {
      this.setState({searchedItem: items[0], searchedEntity: entity, isOpenEntityModal: true});
    }
  }

  onCloseEntityModal = () => this.setState({isOpenEntityModal: false});

  render() {
    const {
      isLoading,
      configs,
      selectedConfig,
      selectedEntity,
      items,
      isFullLoaded,
      filterCount,
      aggCount,
      selectedColumns,
      entities,
      isError,
      message,
      removeConfig,
      attributes,
      t
    } = this.props;
    const {
      isSettingCollapsed, selectedTool, isModalUrl, isOpenConfigMdoal, isOpenEntityModal,
      searchedItem, searchedEntity
    } = this.state;
    const isRealLoading = isLoading || !isFullLoaded;
    const selectedObjectEntity = entities.find(entity => entity.name === searchedEntity);
    
    return (
      <MainContainer>
        <Header
          selectedConfig={selectedConfig}
          configs={configs}
          onChangeNetwork={this.onChangeNetwork}
          openModal={this.openConfigModal}
          onRemoveConfig={removeConfig}
          onSearch={this.onSearchById}
        />
        <Container>
          {isFullLoaded && (
            <React.Fragment>
              <TabsWrapper
                value={selectedEntity}
                variant='scrollable'
                onChange={(event, newValue) => this.onChangeTab(newValue)}
              >
                {entities.map((entity, index) => (
                  <TabWrapper
                    key={index}
                    value={entity.name}
                    label={t(`containers.arronax.${entity.name}`)}
                  />
                ))}
              </TabsWrapper>
              <Toolbar
                isCollapsed={isSettingCollapsed}
                selectedTool={selectedTool}
                filterCount={filterCount}
                aggCount={aggCount}
                columnsCount={selectedColumns.length}
                onChangeTool={this.onChangeTool}
                onExportCsv={this.onExportCsv}
                onShareReport={this.onShareReport}
              />
              <SettingsPanel
                ref={this.settingRef}
                isCollapsed={isSettingCollapsed}
                selectedTool={selectedTool}
                onSubmit={this.onSubmit}
                onClose={this.onCloseFilter}
              />
              <TabContainer>
                {items.length > 0 && <CustomTable isModalUrl={isModalUrl} isLoading={isLoading} items={items} onExportCsv={this.onExportCsv} /> }
                {items.length === 0 && isFullLoaded && (
                  <NoResultContainer>
                    <OctopusImg src={octopusSrc} />
                    <NoResultContent>
                      <NoResultTxt>{t('containers.arronax.no_results')}</NoResultTxt>
                      <TryTxt>{t('containers.arronax.try_combination')}</TryTxt>
                      <ButtonContainer>
                        <ClearButton onClick={this.onClearFilter}>{t('containers.arronax.clear_filters')}</ClearButton>
                        <TryButton onClick={this.onSettingCollapse}>{t('containers.arronax.try_again')}</TryButton>
                      </ButtonContainer>
                    </NoResultContent>
                  </NoResultContainer>
                )}
              </TabContainer>
            </React.Fragment>
          )}
        </Container>
        <Footer />
        {isRealLoading && <Loader />}
        <Dialog
          open={isError}
          onClose={this.handleErrorClose}
          aria-labelledby='alert-dialog-title'
          aria-describedby='alert-dialog-description'
        >
          <DialogTitle id='alert-dialog-title'>{t('general.nouns.error')}</DialogTitle>
          <DialogContent>
            <DialogContentText id='alert-dialog-description'>
              {message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <DismissButton onClick={this.handleErrorClose}>{t('general.verbs.dismiss')}</DismissButton>
          </DialogActions>
        </Dialog>
        <ConfigModal
          t={t}
          open={isOpenConfigMdoal}
          onClose={this.closeConfigModal}
          addConfig={this.onAddConfig}
        />
        {isOpenEntityModal && 
          <EntityModal
            open={isOpenEntityModal}
            title={selectedObjectEntity.displayName}
            attributes={attributes[searchedEntity]}
            item={searchedItem}
            isLoading={isLoading}
            onClose={this.onCloseEntityModal}
          />
        }
      </MainContainer>
    );
  }
}

const mapStateToProps = (state: any) => ({
  filterCount: getFilterCount(state),
  isLoading: getLoading(state),
  configs: getConfigs(state),
  selectedConfig: getSelectedConfig(state),
  selectedEntity: getEntity(state),
  items: getItems(state),
  isFullLoaded: getIsFullLoaded(state),
  selectedColumns: getColumns(state),
  entities: getEntities(state),
  isError: getErrorState(state),
  message: getMessageTxt(state),
  aggCount: getAggregations(state).length,
  attributes: getAttributesAll(state)
});

const mapDispatchToProps = (dispatch: any) => ({
  removeAllFilters: (selectedEntity: string) =>
    dispatch(removeAllFiltersAction(selectedEntity)),
  changeNetwork: (config: Config) => dispatch(changeNetwork(config)),
  changeTab: (type: string) => dispatch(changeTab(type)),
  initLoad: (e: string, q: string) => dispatch(initLoad(e, q)),
  submitQuery: () => dispatch(submitQuery()),
  exportCsvData: () => dispatch(exportCsvData()),
  shareReport: () => dispatch(shareReport()),
  initMessage: () => dispatch(clearMessageAction()),
  addConfig: (config: Config, isUse: boolean) => dispatch(addConfigAction(config, isUse)),
  removeConfig: (index: number) => dispatch(removeConfigAction(index)),
  searchById: (id: string | number) => dispatch(searchByIdThunk(id))
});

export default compose(
  withTranslation(),
  DragDropContext(HTML5Backend),
  withRouter,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(Arronax);
