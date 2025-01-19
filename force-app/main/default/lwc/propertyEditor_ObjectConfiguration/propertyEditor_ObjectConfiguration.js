import { LightningElement, api, track, wire } from 'lwc';
import GetObjectTypes from '@salesforce/apex/PropertyEditor_ObjectConfiguration.GetObjectTypes';
import GetPicklistFields from '@salesforce/apex/PropertyEditor_ObjectConfiguration.GetPicklistFields';
import GetPicklistFieldValues from '@salesforce/apex/PropertyEditor_ObjectConfiguration.GetPicklistFieldValues';
import { refreshApex } from '@salesforce/apex';

export default class PropertyEditor_ObjectConfiguration extends LightningElement {

    get activeSections() {
        return [
            'data',
            'style',
            'options',
        ]
    }

    get dataSourceOptions() {
        return [
            {label: 'SObject Field', value: 'sobject_field'},
            {label: 'Custom List', value: 'custom_list'},
            {label: 'SObject Records', value: 'sobject_records'}        
        ]
    }

    @track selectedDataSource;
    handleSelectedDataSource(event) {
        const value = event.detail.value;
        if(value == this.selectedDataSource) return;
        this.handleRefreshSObjectConfiguration();
        this.selectedDataSource = value;
        this.debugMessage('Selected Data Source: '+this.selectedDataSource);
        this.dispatchEvent(new CustomEvent("selected_data_source", 
        {detail: {value: this.selectedDataSource}}));
    }

    get listStyleOptions() {
        return [
            {label: 'Checkbox', value: 'checkbox'},
            {label: 'Radio', value: 'radio'},
            {label: 'Dropdown', value: 'dropdown'},
            {label: 'Button', value: 'button'},
            {label: 'Tile', value: 'tile'}
        ]
    }

    @track selectedListStyle;
    handleSelectedListStyle(event) {
        this.selectedListStyle = event.detail.value;
        this.debugMessage('Selected List Style: '+this.selectedListStyle);
        this.dispatchEvent(new CustomEvent("selected_list_style", 
        {detail: {value: this.selectedListStyle}}));
    }

    get valueStyleOptions() {
        return [
            {label: 'Standard', value: 'standard'},
            {label: 'With Icon', value: 'with_icon'},
            {label: 'Only Icon', value: 'only_icon'},
        ];
    }

    get showValueStyleOptions() {
        return this.selectedListStyle == 'button' || this.selectedListStyle == 'tile';
    }

    @track selectedValueStyle;
    handleSelectedValueStyle(event) {
        this.selectedValueStyle = event.detail.value;
        this.debugMessage('Selected Value Style: '+this.selectedValueStyle);
        this.dispatchEvent(new CustomEvent("selected_value_style", 
        {detail: {value: this.selectedValueStyle}}));
    }

    @track numberOfColumns = 1;
    handleColumnSelection(event) {
        this.numberOfColumns = event.detail.value;
        this.debugMessage('Selected Number of Columns: '+this.numberOfColumns);
        this.dispatchEvent(new CustomEvent("selected_columns", 
        {detail: {value: this.numberOfColumns}}));
    }

    @track paginationEnabled = false;
    handlePaginationEnabled(event) {
        const value = !this.paginationEnabled;
        this.paginationEnabled = value;
        this.debugMessage('Pagination Enabled: '+this.paginationEnabled);
        this.dispatchEvent(new CustomEvent("pagination_enabled", 
        {detail: {value: this.paginationEnabled}}));
    }

    @track searchEnabled = false;
    handleSearchEnabled(event) {
        const value = !this.searchEnabled;
        this.searchEnabled = value;
        this.debugMessage('Search Enabled: '+this.searchEnabled);
        this.dispatchEvent(new CustomEvent("search_enabled", 
        {detail: {value: this.searchEnabled}}));
    }

    get showRowSelection() {
        return this.paginationEnabled;
    }

    @track numberOfRows = 10;
    handleRowSelection(event) {
        this.numberOfRows = event.detail.value;
        this.debugMessage('Selected Number of Rows: '+this.numberOfRows);
        this.dispatchEvent(new CustomEvent("selected_rows", 
        {detail: {value: this.numberOfRows}}));
    }

    get showSObjectConfiguration() {
        return this.selectedDataSource == 'sobject_field' || this.selectedDataSource == 'sobject_records';
    }

    get objectTypeOptions() {
        return this._objectTypes;
    }
    get disableObjectTypeOptions() {
        return !this._objectTypes;
    }

    _objectTypes;
    @wire(GetObjectTypes)
    wiredGetObjectTypes({error, data}) {
        if(data) {
            this.debugMessage('Get Object Types Data: '+JSON.stringify(data));
            this._objectTypes = data.map(objectType => {
                return {
                    label: objectType.label,
                    value: objectType.apiName
                };
            });
        } else if(error) {
            this.debugMessage('Get Object Types Error: '+JSON.stringify(error));
        }
    }

    @track selectedObjectType;
    handleSelectedObjectType(event) {
        this.selectedObjectType = event.detail.value;
        this.debugMessage('Selected Object Type: '+this.selectedObjectType);
        this.dispatchEvent(new CustomEvent("seleted_object_type", 
        {detail: {value: this.selectedObjectType}}));
    }

    get picklistFieldOptions() {
        return this._picklistFields;
    }
    get showPicklistFieldOptions() {
        return this.selectedDataSource == 'sobject_field';
    }
    get disablePicklistFieldOptions() {
        return !this._picklistFields;
    }
    

    _picklistFields;
    @wire(GetPicklistFields, {objectType: '$selectedObjectType'})
    wiredGetPicklistFields({error, data}) {
        this._picklistFields = undefined;
        if(data) {
            this.debugMessage('Get Picklist Fields Data: '+JSON.stringify(data));
            this._picklistFields = data.map(picklistField => {
                return {
                    label: picklistField.label,
                    value: picklistField.apiName
                };
            });
        } else if(error) {
            this.debugMessage('Get Picklist Fields Error: '+JSON.stringify(error));
        }
    }

    @track selectedPicklistField;
    handleSelectPicklistField(event) {
        this.selectedPicklistField = event.detail.value;
        this.debugMessage('Selected Picklist Field: '+this.selectedPicklistField);
        this.dispatchEvent(new CustomEvent("selected_picklist_field", 
        {detail: {value: this.selectedPicklistField}}));
    }

    handleRefreshSObjectConfiguration() {
        this.selectedObjectType = undefined;
        this.selectedPicklistField = undefined;
        this.handleRefreshPicklistFieldValues();
    }

    get picklistFieldValues() {
        return this._picklistFieldValues;
    }
    get showPicklistFieldValues() {
        return this._picklistFieldValues;
    }

    @track _picklistFieldValues;
    wiredPicklistFieldValues;
    @wire(GetPicklistFieldValues, {objectType: '$selectedObjectType', picklistField: '$selectedPicklistField'})
    wiredGetPicklistFieldValues(result) {
        this.wiredPicklistFieldValues = result;
        const {error, data} = result;
        this._picklistFieldValues = undefined;
        if(data) {
            this.debugMessage('Get Picklist Field Values Data: '+JSON.stringify(data));
            this._picklistFieldValues = data.map(picklistFieldValue => {
                return {
                    id: picklistFieldValue.apiName,
                    label: picklistFieldValue.label,
                    value: picklistFieldValue.apiName,
                    fixedValue: true
                };
            });
        } else if(error) {
            this.debugMessage('Get Picklist Field Values Error: '+JSON.stringify(error));
        }
    }

    handleAddOption(event) {
        this.debugMessage('Add List Option');
        const id = this._picklistFieldValues === undefined ? 0 : this._picklistFieldValues.length; // temp hack to get unique id
        const newOption = {
            id: id, label: '', value: '', fixedValue: false
        };
        if(this._picklistFieldValues === undefined) {
            this._picklistFieldValues = [newOption];
        } else {
            this._picklistFieldValues.push(newOption);    
        }
    }

    get disableAddOption() {
        if(this.selectedDataSource == 'custom_list') return false;
        if(this._picklistFieldValues === undefined) return true;
        return false;
    }

    get enableCustomColour() {
        return this.selectedListStyle == 'tile' || (this.selectedListStyle == 'button');
    }

    handleRefreshPicklistFieldValues(event) {
        this.debugMessage('Refresh Picklist Field Values');
        const currentPicklistField = this.selectedPicklistField;
        this._picklistFieldValues = undefined;
        this.selectedPicklistField = undefined;
        this.selectedPicklistField = currentPicklistField;
    }

    handleRemoveOption(event) {
        const id = event.currentTarget.dataset.id;
        this.debugMessage('Remove List Option: '+id);
        const index = this._picklistFieldValues.findIndex(option => option.id === id);
        this._picklistFieldValues.splice(index, 1);
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
            const newItems = [...this._picklistFieldValues];
            const [movedItem] = newItems.splice(this.draggedIndex, 1);
            newItems.splice(dropIndex, 0, movedItem);

            this._picklistFieldValues = newItems.map((item, index) => ({
                ...item,
                order: index + 1
            }));

            console.log('Items: '+JSON.stringify(this._picklistFieldValues));

            this.dispatchEvent(new CustomEvent('listreorder', {
                detail: { items: this._picklistFieldValues }
            }));
        }
    }

    handleDragEnd(event) {
        if (this.draggedItem) {
            this.draggedItem.classList.remove('dragging');
            this.draggedItem = null;
            this.draggedIndex = null;
        }
    }

    debug = true;
    debugMessage(message) {
        if(this.debug) {
            console.log(message);
        }
    }

}