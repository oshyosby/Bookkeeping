import { LightningElement, api, track } from 'lwc';
import { FlowAttributeChangeEvent, FlowNavigationNextEvent } from 'lightning/flowSupport';

const dummyOptions = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
];

export default class PicklistMaster extends LightningElement {

    @api 
    get listLabel() {
        return this.listLabel;
    }
    set listLabel(value) {
        this._listLabel = value;
    }
    _listLabel;

    @api 
    get listType() {
        return this._listType;
    }
    set listType(value) {
        this._listType = value;
    }
    _listType;
    
    @api 
    get listSource() {
        return this._listSource;
    }
    set listSource(value) {
        this._listSource = value;
    }
    _listSource;

    @api 
    get sourceObject() {
        return this._sourceObject;
    }
    set sourceObject(value) {
        this._sourceObject = value;
    }
    _sourceObject;

    @api 
    get objectField() {
        return this._objectField;
    }
    set objectField(value) {
        this._objectField = value;
    }
    _objectField;

    @api 
    get multiSelect() {
        return this._multiSelect || false;
    }
    set multiSelect(value) {
        this._multiSelect = value;
    }
    _multiSelect;

    @api 
    get navigational() {
        return this._navigational || false;
    }
    set navigational(value) {
        this._navigational = value;
    }
    _navigational;

    @api 
    get options() {
        return dummyOptions || [];
    }
    set options(value) {
        this._options = value;
    }
    _options;

    @api 
    get valueList() {
        return this._valueList || [];
    }
    set valueList(value) {
        this._valueList = value;
        this.handleValueUpdate();
    }
    _valueList;

    @api 
    get value() {
        return this._value;
    }
    set value(value) {
        this._value = value;
        this.handleValueUpdate();
    }
    _value;

    connectedCallback() {
        switch (this.listType) {
            case 'button':
                this.updateButtonOptions();
                break; 
            default:
                break;
        }
    }

    get isCheckbox() {
        return this.listType === 'checkbox';
    }
    get checkboxOptions() {
        let checkboxOptions = [];
        this.options.forEach(option => {
            checkboxOptions.push({
                ...option,
                checked: this.value.includes(option.value) ? true : false
            })
        });
        return checkboxOptions;
    }
    handleCheckboxGroupValue(event) {
        const selectedValues = event.detail.value;
        this.valueList(selectedValues);
    }
    handleCheckboxValue(event) {
        const selectedValue = event.target.name;
        this.value(selectedValue);
    }

    get isRadio() {
        return this.listType === 'radio';
    }
    handleRadioValue(event) {
        const selectedValue = event.detail.value;
        this.value(selectedValue);
    }

    get isDropdown() {
        return this.listType === 'dropdown';
    }
    handleDropdownValue(event) {
        const selectedValue = event.detail.value;
        this.value(selectedValue);
    }

    get isButton() {
        return this.listType === 'button';
    }
    @track buttonOptions = [];
    updateButtonOptions() {
        let buttonOptions = [];
        this.options.forEach(option => {
            buttonOptions.push({
                ...option,
                variant: this.checkForValue(option.value) ? 'brand' : 'neutral'
            })
        });
        this.buttonOptions = buttonOptions;
    }
    handleButtonValue(event) {
        const selectedValue = event.target.name;
        console.log('Selected Button Value: '+selectedValue);
        if(!this.isMultiSelect) {
            this.singleButtonSelection(selectedValue);
        } else {
            this.multiButtonSelection(selectedValue);
        }
        this.updateButtonOptions();
        if(!this.navigational) return 
        this.handleFlowNavigation();
    }
    singleButtonSelection(selectedValue) {
        console.log('Single Selection');
        this.value(this.navigational ? selectedValue : this.checkForValue(selectedValue) ? '' : selectedValue);
    }
    multiButtonSelection(selectedValue) {
        console.log('Multiple Selection');
        if(this.checkForValue(selectedValue)) {
            this.removeButtonValue(selectedValue);
        } else {
            this.addButtonValue(selectedValue);
        }
        console.log('Button Options: '+JSON.stringify(this.buttonOptions));
    }
    removeButtonValue(value) {
        console.log('Remove Value');
        this.valueList(this.valueList.filter(item => item !== value)); 
    }
    addButtonValue(value) {
        console.log('Add Value');
        this.valueList([...this.valueList,value]);
    }

    checkForValue(value) {
        return this.valueList.includes(value) || this.value == value;
    }

    handleValueUpdate() { 

        const value = this.value ?? this.valueList[0] ?? '';
        const valueChange = new FlowAttributeChangeEvent(
            'value',
            value
        );

        const valueList = this.valueList ?? [this.value] ?? [];
        const valueListChange = new FlowAttributeChangeEvent(
            'valueList',
            valueList
        );

        this.dispatchEvent(valueChange);
        this.dispatchEvent(valueListChange);
    }

    @api
    availableActions = [];

    handleFlowNavigation() {
        if (this.availableActions.find((action) => action === 'NEXT')) {
            // navigate to the next screen
            const navigateNextEvent = new FlowNavigationNextEvent();
            this.dispatchEvent(navigateNextEvent);
        }
    }
}