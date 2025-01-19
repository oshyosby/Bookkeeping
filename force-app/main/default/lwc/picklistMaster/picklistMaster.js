import { LightningElement, api, track } from 'lwc';
import { FlowAttributeChangeEvent, FlowNavigationNextEvent } from 'lightning/flowSupport';

const dummyOptions = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
    { label: 'Option 3', value: '3' },
];

export default class PicklistMaster extends LightningElement {

    @api listLabel;
    @api listType;
    @api listSource;
    @api sourceObject;
    @api objectField;
    @api multiSelect;
    @api navigational;
    @api options = dummyOptions;
    @api value;

    get isArrayValue() {
        return Array.isArray(this.value);
    }

    get getListLabel() {
        return this.listLabel;
    }

    get isMultiSelect() {
        return this.multiSelect;
    }

    get getOptions() {
        return this.options;
    }

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
        let options = [];
        this.getOptions.forEach(option => {
            options.push({
                ...option,
                checked: this.value.includes(option.value) ? true : false
            })
        });
        return options;
    }

    get checkBoxGroupValue() {
        return this.value == undefined ? [] : this.value;
    }

    handleCheckboxGroupValue(event) {
        const selectedValues = event.detail.value;
        this.value = selectedValues;
        this.handleValueUpdate();
    }
    
    handleCheckboxValue(event) {
        const selectedValue = event.target.name;
        this.value = selectedValue;
        this.handleValueUpdate();
    }


    get isRadio() {
        return this.listType === 'radio';
    }

    handleRadioValue(event) {
        const selectedValue = event.detail.value;
        this.value = selectedValue;
        this.handleValueUpdate();
    }

    get isDropdown() {
        return this.listType === 'dropdown';
    }

    handleDropdownValue(event) {
        const selectedValue = event.detail.value;
        this.value = selectedValue;
        this.handleValueUpdate();
    }

    get isButton() {
        return this.listType === 'button';
    }

    @track buttonOptions = [];
    updateButtonOptions() {
        let options = [];
        this.getOptions.forEach(option => {
            options.push({
                ...option,
                variant: this.checkForValue(option.value) ? 'brand' : 'neutral'
            })
        });
        this.buttonOptions = options;
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
        console.log('Value: '+this.value);
        this.handleValueUpdate();
        console.log('Navigate: '+this.navigational);
        if(this.navigational) this.handleFlowNavigation();
    }

    singleButtonSelection(selectedValue) {
        console.log('Single Selection');
        this.value = this.navigational ? selectedValue : this.checkForValue(selectedValue) ? '' : selectedValue;
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
        if(this.isArrayValue) {
            this.value = this.value.length == 1 ? [] : this.value.filter(item => item !== value); 
        } else {
            this.value = [];
        }
    }

    addButtonValue(value) {
        console.log('Add Value');
        if(this.isArrayValue) {
            this.value.push(value);
        } else if(this.value !== '') {
            this.value = [this.value,value];
        } else {
            this.value = [value];
        }
    }

    checkForValue(value) {
        if (this.isArrayValue) {
            return this.value.includes(value);
        } else {
            return value === this.value;
        }
    }

    handleValueUpdate() { 

        const singleValue = this.isArrayValue ? this.value[0] : this.value;
        const singleValueChange = new FlowAttributeChangeEvent(
            'singleValue',
            singleValue
        );

        const multiValue = this.isArrayValue ? this.value : [this.value];
        const multiValueChange = new FlowAttributeChangeEvent(
            'multiValue',
            multiValue
        );

        this.dispatchEvent(singleValueChange);
        this.dispatchEvent(multiValueChange);
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