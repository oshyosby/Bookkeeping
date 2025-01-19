import { LightningElement, api, track, wire } from 'lwc';
import GetObjectTypes from '@salesforce/apex/PicklistMaster.GetObjectTypes';
import GetObjectFields from '@salesforce/apex/PicklistMaster.GetObjectFields';
import GetPicklistFieldValues from '@salesforce/apex/PropertyEditor_ObjectConfiguration.GetPicklistFieldValues';

const multiSelectTypes = ['checkbox','button'];

const inputTypeMap = {
    listLabel: 'String',
    listType: 'String',
    listSource: 'String',
    sourceObject: 'String',
    objectField: 'String',
    multiSelect: 'Boolean',
    navigational: 'Boolean',
    value: 'String'
}

const dataTypes = [
    'BOOLEAN',
    'COMBOBOX',
    'PICKLIST',
    'MULTIPICKLIST'
]

export default class PicklistMasterEditor extends LightningElement {

    get activeSections() {
        return ['listType','listSource'];
    }

    get dataTypes() {
        return dataTypes;
    }

    get sourceObjectOptions() {
        return this._sourceObjects !== undefined ? this._sourceObjects : [];
    }

    get objectFieldOptions() {
        if(this._objectFields === undefined) return [];
        return this._objectFields.map(objectField => {
            return {
                label: objectField.label,
                value: objectField.apiName
            };
        });
    }

    _inputVariables = [];

    @api
    get inputVariables() {
        return this._inputVariables;
    }

    set inputVariables(variables) {
        this._inputVariables = variables || [];
    }

    get listLabel() {
        const param = this.inputVariables.find(({ name }) => name === "listLabel");
        return param && param.value;
    }
    handleListLabel(event) {
        const newValue = event.target.value;
        this.handleChange("listLabel",newValue);
    }

    get listTypeOptions() {
        return [
            { label: 'Checkbox', value: 'checkbox' },
            { label: 'Radio', value: 'radio' },
            { label: 'Dropdown', value: 'dropdown'},
            { label: 'Button', value: 'button'},
        ]
    }
    get listType() {
        const param = this.inputVariables.find(({ name }) => name === "listType");
        return param && param.value;
    }
    handleListType(event) {
        const newValue = event.target.value;
        if(!multiSelectTypes.includes(newValue)) {
            this.handleChange('multiSelect',false);
        }
        this.handleChange("listType",newValue);
    }

    get listSourceOptions() {
        return [
            { label: 'SObject Field', value: 'field' },
            { label: 'Custom', value: 'custom' },
            //{ label: 'SObject Records', value: 'records'},
        ]
    }
    get listSource() {
        const param = this.inputVariables.find(({ name }) => name === "listSource");
        return param && param.value;
    }
    handleListSource(event) {
        const newValue = event.target.value;
        this.handleChange("listSource",newValue);
    }

    _sourceObjects;
    @wire(GetObjectTypes)
    wiredGetObjectTypes({ error, data }) {
        if (data) {
            console.log('Get Object Types Data: '+JSON.stringify(data));
            this._sourceObjects = data.map(objectType => {
                return {
                    label: objectType.label,
                    value: objectType.apiName
                };
            });
        } else if(error)  {
            console.log('Get Object Types Error: '+JSON.stringify(error));
        } 
    }
    get sourceObjectRequired() {
        return this.listSource === 'field';
    }
    get sourceObject() {
        const param = this.inputVariables.find(({ name }) => name === "sourceObject");
        return param && param.value;
    }
    handleSourceObject(event) {
        const newValue = event.target.value;
        this.handleChange("sourceObject",newValue);

        GetObjectFields({ sourceObject: newValue, dataTypes: this.dataTypes })
        .then(data => {
            console.log('Get Object Fields Data: '+JSON.stringify(data));
            this._objectFields = data;
        })
        .catch(error => {
            console.log('Get Object Fields Error: '+JSON.stringify(error));
        });
    }

    _objectFields;
    get objectFieldRequired() {
        return this.listSource === 'field';
    }
    get objectField() {
        const param = this.inputVariables.find(({ name }) => name === "objectField");
        return param && param.value;
    }
    handleObjectField(event) {
        const newValue = event.target.value;
        this.handleChange("objectField",newValue);
    }

    _picklistValues;
    get picklistValues() {
        const param = this.inputVariables.find(({ name }) => name === "picklistValues");
        return param && param.value;
    }
    

    get multiSelect() {
        const param = this.inputVariables.find(({ name }) => name === "multiSelect");
        if(param === undefined) return false;
        return param && param.value;
    } 
    get multiSelectEnabled() {
        return multiSelectTypes.includes(this.listType) && this.navigational == false;
    }  
    handleMultiSelect(event) {
        const newValue = !this.multiSelect;
        this.handleChange("multiSelect",newValue);
    }
    
    get navigational() {
        const param = this.inputVariables.find(({ name }) => name === "navigational");
        if(param === undefined) return false;
        return param && param.value;
    }
    get navigationEnabled() {
        return this.listType === 'button' && this.multiSelect == false;
    }
    handleNavigational(event) {
        const newValue = !this.navigational;
        this.handleChange("navigational",newValue);
    }

    get value() {
        const param = this.inputVariables.find(({ name }) => name === "value");
        return param && param.value;
    }
    handleValue(event) {
        const newValue = event.target.value;
        this.handleChange("value",newValue);
    }

    handleChange(property,value) {
        console.log('Handle Change');
        console.log('property: ' + property);
        const newValue = value;
        console.log('New Value: ' + JSON.stringify(newValue));
        const dataType = inputTypeMap[property];
        console.log('dataType: ' + dataType);
        const valueChangedEvent = new CustomEvent("configuration_editor_input_value_changed", {
            bubbles: true,
            cancelable: false,
            composed: true,
            detail: {
            name: property,
            newValue,
            newValueDataType: inputTypeMap[property],
            },
        });
        this.dispatchEvent(valueChangedEvent);
        console.log('inputVariables: '+JSON.stringify(this.inputVariables));
    }


    @api
    validate() {
        
        const validity = [];
        
        console.log('Validate List Label');
        const listLabelCmp = this.template.querySelector('[data-id="listLabelInput"]');
        if(listLabelCmp == undefined) return ['Unable to Locate List Label Input'];
        if(this.listLabel === undefined || this.listLabel === "") {
            const error = "List Label is required";
            listLabelCmp.setCustomValidity(error);
            validity.push({
                key: "List Label",
                errorString: error,
            });
        } else {
            listLabelCmp.setCustomValidity("");
        }
        listLabelCmp.reportValidity();
        
        console.log('Validate List Type');
        const listTypeCmp = this.template.querySelector('[data-id="listTypeInput"]')
        if(this.listLabel === undefined || this.listLabel === "") {
            const error = "List Type is required";
            listTypeCmp.setCustomValidity(error);
            validity.push({
                key: "List Type",
                errorString: error,
            });
        } else {
            listTypeCmp.setCustomValidity("");
        }
        listTypeCmp.reportValidity();

        console.log('Validate List Source');
        const listSourceCmp = this.template.querySelector('[data-id="listSourceInput"]')
        if(this.listSource === undefined || this.listSource === "") {
            const error = "List Source is required";
            listSourceCmp.setCustomValidity(error);
            validity.push({
                key: "List Source",
                errorString: error,
            });
        } else {
            listSourceCmp.setCustomValidity("");
        }
        listSourceCmp.reportValidity();

        if(this.listSource == "field") {
            console.log('Validate Source Object');
            const sourceObjectCmp = this.template.querySelector('[data-id="sourceObjectInput"]')
            if(this.sourceObject === undefined || this.sourceObject === "") {
                const error = "Source Object is required";
                sourceObjectCmp.setCustomValidity(error);
                validity.push({
                    key: "Source Object",
                    errorString: error,
                });
            } else {
                sourceObjectCmp.setCustomValidity("");
            }
            sourceObjectCmp.reportValidity();
        }

        //const multiSelectCmp = this.template.querySelector("lightning-input[name=multiSelect]");
        //const navigationCmp = this.template.querySelector("lightning-input[name=navigational]");
        //const valueCmp = this.template.querySelector("lightning-input[name=value]");

        return validity;
    }
}