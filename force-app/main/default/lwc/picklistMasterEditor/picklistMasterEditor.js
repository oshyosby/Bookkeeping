import { LightningElement, api, track, wire } from 'lwc';
import GetObjectTypes from '@salesforce/apex/PicklistMaster.GetObjectTypes';
import GetObjectFields from '@salesforce/apex/PicklistMaster.GetObjectFields';
import GetPicklistValues from '@salesforce/apex/PicklistMaster.GetPicklistValues';
import { inputTypeMap, multiSelectTypes, dataTypes, listDataSource, picklistTypes } from './picklistMasterEditorUtils.js';

export default class PicklistMasterEditor extends LightningElement {

    renderedCallback() {
        this._sourceObject = this.sourceObject;
        this._objectField = this.objectField;
    }

    get activeSections() {
        return ['listType','listSource'];
    }

    get dataTypes() {
        return dataTypes;
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
    set listLabel(value) {
        this._listLabel = value;
        this.handleChange("listLabel",this._listLabel);

    }
    _listLabel;
    handleListLabel(event) {
        const newValue = event.target.value;
        this.listLabel = newValue;
    }

    get listTypeOptions() {
        return picklistTypes;
    }
    get listType() {
        const param = this.inputVariables.find(({ name }) => name === "listType");
        return param && param.value;
    }
    set listType(value) {
        this._listType = value;
        this.handleChange("listType",this._listType);
    }
    _listType;
    handleListType(event) {
        const newValue = event.target.value;
        if(!multiSelectTypes.includes(newValue)) {
            this.multiSelect = false;
        }
        this.listType = newValue;
    }

    get listSourceOptions() {
        return listDataSource;
    }
    get listSource() {
        const param = this.inputVariables.find(({ name }) => name === "listSource");
        return param && param.value;
    }
    set listSource(value) {
        this._listSource = value;
        this.handleChange("listSource",this._listSource);
        this.sourceObject = "";
    }
    _listSource;
    handleListSource(event) {
        const newValue = event.target.value;
        this.listSource = newValue;
    }

    get sourceObjectOptions() {
        if(this._sourceObjects === undefined) return [];
        return this._sourceObjects.map(objectType => {
            return {
                label: objectType.label,
                value: objectType.apiName
            };
        });
    }
    _sourceObjects;
    @wire(GetObjectTypes)
    wiredGetObjectTypes({ error, data }) {
        if (data) {
            console.log('Get Object Types Data: '+JSON.stringify(data));
            this._sourceObjects = data;
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
    set sourceObject(value) {
        this._sourceObject = value;
        this.handleChange("sourceObject",this._sourceObject);
        this.objectField = "";
    }

    @track _sourceObject;
    handleSourceObject(event) {
        const newValue = event.target.value;
        this.sourceObject - newValue;
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
    _objectFields;
    @wire(GetObjectFields, { sourceObject: '$_sourceObject', dataTypes: '$dataTypes' })
    wiredGetObjectFields({ error, data }) {
        if (data) {
            console.log('Get Object Fields Data: '+JSON.stringify(data));
            this._objectFields = data;
        } else if(error)  {
            console.log('Get Object Fields Error: '+JSON.stringify(error));
        } 
    }
    get objectFieldRequired() {
        return this.listSource === 'field';
    }
    get objectField() {
        const param = this.inputVariables.find(({ name }) => name === "objectField");
        return param && param.value;
    }
    set objectField(value) {
        this._objectField = value;
        this.handleChange("objectField",this._objectField);
    }
    @track _objectField;
    handleObjectField(event) {
        const newValue = event.target.value;
        this.objectField = newValue;
    }

    _defaultOptions;
    @wire(GetPicklistValues, {sourceObject: '$_sourceObject', picklistField: '$_objectField'})
    wiredGetPicklistValues({error, data}) {
        if(data) {
            console.log('Get Picklist Values Data: '+JSON.stringify(data));
            const formattedData = data.map(picklistValue => {
                return {
                    id: picklistValue.value,
                    label: picklistValue.label,
                    value: picklistValue.value,
                    editing: false,
                    updated: false,
                    fixedValue: true
                };
            });
            this._defaultOptions = formattedData;
            if(this._options !== undefined) return;
            this.options = this._defaultOptions;
            
        } else if(error) {
            console.log('Get Picklist Values Error: '+JSON.stringify(error));
        }
    }
    get listOptions() {
        return this._options || this.options;
    }
    get options() {
        const param = this.inputVariables.find(({ name }) => name === "options");
        return param && param.value;
    }
    set options(value) {
        this._options = value;
        //this.handleChange("options",this._options);
    }
    _options;
    handleOptionAction(event) {
        const selectedAction = event.detail.value;
        const optionId = event.currentTarget.dataset.id;
        console.log('Option Action: '+selectedAction);
        console.log('Option Id: '+optionId);
        switch (selectedAction) {
            case 'edit':
                this.handleEditOption(optionId);
                break;
            case 'remove':
                this.handleRemoveOption(optionId);
                break;
            default:
                break;
        }
    }
    handleEditOption(optionId) {
        const optionToUpdate = this._options.filter(option => option.id == optionId);
        if(optionToUpdate === undefined) return;
        optionToUpdate.editing = true;
    }
    handleRemoveOption(optionId) {
        const optionToRemove = this._options.filter(option => option.id == optionId);
        if(optionToRemove == undefined) return;
        const updatedValues = this._options.filter(option => option.id !== optionId);
        this.options = updatedValues; 
    }

    handleAddOption(event) {
        const optionId = '';
        if(this._options === undefined) this._options = [];
        this._options.push({ 
            id: optionId, 
            label: '', 
            value: '', 
            editing: true,
            updated: false,
            fixedValue: false 
        });
    }
    handleResetOptions(event) {
        const newValues = this._defaultOptions ?? [];
        this.options = newValues;
    }

    get multiSelect() {
        const param = this.inputVariables.find(({ name }) => name === "multiSelect");
        if(param === undefined) return false;
        return param && param.value;
    }
    set multiSelect(value) {
        this._multiSelect = value;
        this.handleChange("multiSelect",this._multiSelect);
    }
    _multiSelect; 
    get multiSelectEnabled() {
        return multiSelectTypes.includes(this.listType) && this.navigational == false;
    }  
    handleMultiSelect(event) {
        const newValue = !this.multiSelect;
        this.multiSelect = newValue;
    }
    
    get navigational() {
        const param = this.inputVariables.find(({ name }) => name === "navigational");
        if(param === undefined) return false;
        return param && param.value;
    }
    set navigational(value) {
        this._navigational = value;
        this.handleChange("navigational",this._navigational);
    }
    get navigationEnabled() {
        return this.listType === 'button' && this.multiSelect == false;
    }
    handleNavigational(event) {
        const newValue = !this.navigational;
        this.navigational = newValue;
    }

    get value() {
        const param = this.inputVariables.find(({ name }) => name === "value");
        return param && param.value;
    }
    set value(value) {
        this._value = value;
        this.handleChange("value",this._value);
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

            console.log('Validate Object Field');
            const objectFieldCmp = this.template.querySelector('[data-id="objectFieldInput"]')
            if(this.objectField === undefined || this.objectField === "") {
                const error = "Object Field is required";
                objectFieldCmp.setCustomValidity(error);
                validity.push({
                    key: "Object Field",
                    errorString: error,
                });
            } else {
                objectFieldCmp.setCustomValidity("");
            }
            objectFieldCmp.reportValidity();
        }

        //const multiSelectCmp = this.template.querySelector("lightning-input[name=multiSelect]");
        //const navigationCmp = this.template.querySelector("lightning-input[name=navigational]");
        //const valueCmp = this.template.querySelector("lightning-input[name=value]");

        return validity;
    }

    draggedItem = null;
    draggedIndex = null;

    constructor() {
        super();
        this.template.addEventListener('dragstart', this.handleDragStart.bind(this));
        this.template.addEventListener('dragover', this.handleDragOver.bind(this));
        this.template.addEventListener('drop', this.handleDrop.bind(this));
        this.template.addEventListener('dragend', this.handleDragEnd.bind(this));
    }

    handleDragStart(event) {
        const item = event.target.closest('[data-item-id]');
        if (item) {
            this.draggedItem = item;
            this.draggedIndex = parseInt(item.dataset.index, 10);
            item.classList.add('dragging');
            
            // Required for Firefox
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', ''); // Required for IE
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';

        const item = event.target.closest('[data-item-id]');
        if (!item || item === this.draggedItem) return;

        const itemRect = item.getBoundingClientRect();
        const midpoint = itemRect.top + itemRect.height / 2;

        if (event.clientY > midpoint) {
            item.parentNode.insertBefore(this.draggedItem, item.nextElementSibling);
        } else {
            item.parentNode.insertBefore(this.draggedItem, item);
        }
    }

    handleDrop(event) {
        event.preventDefault();
        const dropIndex = parseInt(event.target.closest('[data-item-id]').dataset.index, 10);
        
        if (this.draggedIndex !== null && dropIndex !== this.draggedIndex) {
            const newItems = [...this._options];
            const [movedItem] = newItems.splice(this.draggedIndex, 1);
            newItems.splice(dropIndex, 0, movedItem);

            const newValues = newItems.map((item, index) => ({
                ...item,
                order: index + 1
            }));

            this.handleValueOptions(newValues)
        }
    }

    handleDragEnd(event) {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
            this.draggedItem = null;
            this.draggedIndex = null;
        }
    }
}