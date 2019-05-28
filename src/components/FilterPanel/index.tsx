import * as React from 'react';
import { connect } from 'react-redux';
import IconButton from '@material-ui/core/IconButton';
import { ConseilOperator } from 'conseiljs';
import ArronaxIcon from 'components/ArronaxIcon';
import { fetchValues, resetFilters } from '../../reducers/app/thunks';
import {
  getAvailableValues,
  getSelectedFilters,
  getOperators,
  getAttributes,
  getEntity
} from '../../reducers/app/selectors';
import {
  addFilterAction,
  removeFilterAction,
  changeFilterAction
} from '../../reducers/app/actions';
import FilterSelect from '../FilterSelect';
import ValueSelect from '../ValueSelect';
import ValueInput from '../ValueInput';
import { Filter } from '../../types';
import { CARDINALITY_NUMBER } from '../../utils/defaultQueries';
import { getOperatorType } from '../../utils/general';

import {
  Container,
  HeaderTxt,
  MainContainer,
  FilterItemContainer,
  FilterItemGr,
  AddFilterFooter,
  AddFilterButton,
  PlusIconWrapper,
  FilterExpTxt,
  HR,
  RefreshIcon,
  ButtonContainer,
  RunButton,
  ResetButton
} from './style';

type Props = {
  availableValues: object;
  selectedEntity: string;
  attributes: any[];
  filters: Array<Filter>;
  operators: any;
  swipeRef: any;
  fetchValues: (value: string) => void;
  addFilter: (entity: string) => void;
  removeFilter: (entity: string, index: number) => void;
  changeFilter: (entity: string, filter: object, index: number) => void;
  resetFilters: () => void;
  onSubmit: () => void;
};

class FilterPanel extends React.Component<Props, {}> {
  onAddFilter = async () => {
    const { addFilter, selectedEntity, swipeRef } = this.props;
    await addFilter(selectedEntity);
    swipeRef.updateHeight();
  };

  onRemoveFilter = (index) => {
    const {
      removeFilter,
      selectedEntity,
    } = this.props;
    removeFilter(selectedEntity, index);
  };

  onFilterNameChange = (attr, index) => {
    const {
      selectedEntity,
      changeFilter,
      fetchValues,
      availableValues,
      operators
    } = this.props;

    const isLowCardinality = attr.cardinality < CARDINALITY_NUMBER && attr.cardinality !== null;
    if (isLowCardinality && !availableValues[attr.name]) {
      fetchValues(attr.name);
    }
    const operatorType = getOperatorType(attr.dataType);
    const selectedFilter = {
      name: attr.name,
      isLowCardinality,
      operatorType,
      operator: operators[operatorType][0].name,
      values: ['']
    };
    changeFilter(selectedEntity, selectedFilter, index);
  };

  onFilterOperatorChange = (operator, index) => {
    const {
      filters,
      selectedEntity,
      changeFilter,
    } = this.props;

    const selectedFilter = {
      ...filters[index],
      operator: operator.name,
      values: ['']
    };
    changeFilter(selectedEntity, selectedFilter, index);
  };

  onFilterValueChange = (value, index, pos) => {
    const {
      filters,
      selectedEntity,
      changeFilter
    } = this.props;

    const selectedFilter: Filter = {...filters[index]};
    selectedFilter.values[pos] = value;
    changeFilter(selectedEntity, selectedFilter, index);
  };

  onResetFilters = () => {
    const { resetFilters } = this.props;
    resetFilters();
  };

  render() {
    const {
      selectedEntity,
      attributes,
      filters,
      operators,
      availableValues,
      onSubmit
    } = this.props;
    const entityName = selectedEntity.replace(/_/gi, ' ').slice(0, -1);

    const filterLength = filters.length;
    let disableAddFilter = true;
    const lastFilter: any = filterLength > 0 ? filters[filterLength - 1] : {};
    if (filterLength === 0) {
      disableAddFilter = false;
    } else if (lastFilter.operator === ConseilOperator.ISNULL || lastFilter.operator === 'isnotnull') {
      disableAddFilter = false;
    } else if(lastFilter.operator === ConseilOperator.BETWEEN || lastFilter.operator === ConseilOperator.IN) {
      disableAddFilter = lastFilter.values.length !== 2;
    } else if (lastFilter.values[0]) {
      disableAddFilter = false;
    }

    return (
      <Container>
        <MainContainer>
          {filters.map((filter: Filter, index) => {
            const newAttributes = attributes.filter((attr: any) => { return !attr.cardinality || attr.cardinality > 1; });

            return (
              <FilterItemContainer key={index}>
                <FilterItemGr>
                  <FilterSelect
                    value={filter.name}
                    placeholder={`Select ${entityName} Attribute`}
                    items={newAttributes}
                    onChange={attr => this.onFilterNameChange(attr, index)}
                  />
                  {filter.name && <HR />}
                  {filter.name && (
                    <FilterSelect
                      value={filter.operator}
                      placeholder='Select Operator'
                      items={operators[filter.operatorType]}
                      onChange={operator =>
                        this.onFilterOperatorChange(operator, index)
                      }
                    />
                  )}
                  {filter.operator && <HR />}
                  {filter.operator && (filter.operator === ConseilOperator.EQ ||  filter.operator === 'noteq') && filter.isLowCardinality && (
                      <ValueSelect
                        placeholder='Select Value'
                        selectedValue={filter.values[0]}
                        values={availableValues[filter.name]}
                        onChange={value => this.onFilterValueChange(value, index, 0)}
                      />
                  )}
                  {filter.operator &&
                        (filter.operator === ConseilOperator.STARTSWITH || filter.operator === 'notstartWith'
                         || filter.operator === ConseilOperator.ENDSWITH || filter.operator === 'notendWith')
                        && filter.isLowCardinality && (
                    <ValueInput
                      values={filter.values}
                      operator={filter.operator}
                      InputProps={{ disableUnderline: true }}
                      onChange={(value, pos) => this.onFilterValueChange(value, index, pos)}
                    />
                  )}
                  {filter.operator && !filter.isLowCardinality && (
                    <ValueInput
                      values={filter.values}
                      operator={filter.operator}
                      InputProps={{ disableUnderline: true }}
                      onChange={(value, pos) => this.onFilterValueChange(value, index, pos)}
                    />
                  )}
                </FilterItemGr>
                <IconButton
                  aria-label="Delete"
                  onClick={() => this.onRemoveFilter(index)}
                >
                  <ArronaxIcon size="37px" color="#d8d8d8" iconName="icon-delete" />
                </IconButton>
              </FilterItemContainer>
            );
          })}

          <AddFilterFooter isFilters={filters.length > 0}>
            <AddFilterButton
              onClick={this.onAddFilter}
              isDisabled={disableAddFilter}
            >
              <PlusIconWrapper />
              Add Filter
            </AddFilterButton>
          </AddFilterFooter>
        </MainContainer>
        <ButtonContainer>
          <ResetButton onClick={this.onResetFilters}>
            <RefreshIcon size="23px" color="#56c2d9" iconName="icon-reset"/>
            Reset
          </ResetButton>
          <RunButton onClick={onSubmit}>
            Run
          </RunButton>
        </ButtonContainer>
      </Container>
    );
  }
}

const mapStateToProps = state => ({
  filters: getSelectedFilters(state),
  availableValues: getAvailableValues(state),
  operators: getOperators(state),
  attributes: getAttributes(state),
  selectedEntity: getEntity(state)
});

const mapDispatchToProps = dispatch => ({
  fetchValues: (value: string) => dispatch(fetchValues(value)),
  addFilter: (entity: string) => dispatch(addFilterAction(entity)),
  removeFilter: (entity: string, index: number) =>
    dispatch(removeFilterAction(entity, index)),
  changeFilter: (entity: string, filter: object, index: number) =>
    dispatch(changeFilterAction(entity, filter, index)),
  resetFilters: () =>
    dispatch(resetFilters()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(FilterPanel);
