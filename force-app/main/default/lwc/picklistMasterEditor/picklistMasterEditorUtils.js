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

const multiSelectTypes = ['checkbox','button'];

const dataTypes = [
    'BOOLEAN',
    'COMBOBOX',
    'PICKLIST',
    'MULTIPICKLIST'
]

const listDataSource = [
    { label: 'SObject Field', value: 'field' },
    { label: 'Custom', value: 'custom' },
    //{ label: 'SObject Records', value: 'records'},
]

const picklistTypes = [
    { label: 'Checkbox', value: 'checkbox' },
    { label: 'Radio', value: 'radio' },
    { label: 'Dropdown', value: 'dropdown'},
    { label: 'Button', value: 'button'},
]

export {
    inputTypeMap, multiSelectTypes, dataTypes, listDataSource, picklistTypes
}