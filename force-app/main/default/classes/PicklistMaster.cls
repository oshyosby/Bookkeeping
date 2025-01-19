public with sharing class PicklistMaster {

    public class ObjectInfo {
        @AuraEnabled
        public String apiName;
        @AuraEnabled
        public String label;

        public ObjectInfo(String apiName, String label) {
            this.apiName = apiName;
            this.label = label;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<ObjectInfo> GetObjectTypes() {
        Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
        List<ObjectInfo> sObjectInfoList = new List<ObjectInfo>();

        for (String apiName : schemaMap.keySet()) {
            Schema.SObjectType sObjectType = schemaMap.get(apiName);
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();

            // Add to the list
            sObjectInfoList.add(new ObjectInfo(apiName, describeResult.getLabel()));
        }

        return sObjectInfoList;
    }

    public class FieldInfo {
        @AuraEnabled
        public String apiName;
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String type;

        public FieldInfo(String apiName, String label, Schema.DisplayType type) {
            this.apiName = apiName;
            this.label = label;
            this.type = String.valueOf(type);
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<FieldInfo> GetObjectFields(String sourceObject, List<String> dataTypes){
        List<FieldInfo> objectFieldInfoList = new List<FieldInfo>();
        if(sourceObject == null || sourceObject == '') return objectFieldInfoList;
        System.debug('Data Types: '+dataTypes);

        try {
            // Get the SObject Describe result
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(sourceObject);
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();

            // Iterate over fields
            Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();
            for (String fieldName : fieldsMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldsMap.get(fieldName).getDescribe();
                System.debug('Data Type: '+String.valueOf(fieldDescribe.getType()));
                if (!dataTypes.contains(String.valueOf(fieldDescribe.getType())) || fieldDescribe.isCalculated()) continue;
                objectFieldInfoList.add(new FieldInfo(
                    fieldName,
                    fieldDescribe.getLabel(),
                    fieldDescribe.getType()
                ));   
            }
        } catch (Exception e) {
            System.debug('Error retrieving object fields: ' + e.getMessage());
            // Handle errors as needed
        }

        return objectFieldInfoList;   
    }

    public class PicklistInfo {
        @AuraEnabled
        public String label;
        @AuraEnabled
        public String value;
        
        public PicklistInfo(String label, String value) {
            this.label = label;
            this.value = value;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<PicklistInfo> GetPicklistValues(String sourceObject, String picklistField){
        List<PicklistInfo> picklistValuesInfoList = new List<PicklistInfo>();

        if(sourceObject == null || picklistField == null) return picklistValuesInfoList;

        try {
            // Get the SObject Describe result
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(sourceObject);
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();

            // Iterate over fields
            Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();
            Schema.DescribeFieldResult fieldDescribe = fieldsMap.get(picklistField).getDescribe();

            switch on fieldDescribe.getType() {
                when Picklist, MultiPicklist, ComboBox {
                    List<Schema.PicklistEntry> fieldPicklistValues = fieldDescribe.getPicklistValues();
                    for (Schema.PicklistEntry picklistEntry : fieldPicklistValues) {
                        picklistValuesInfoList.add(new PicklistInfo(
                            picklistEntry.getLabel(),
                            picklistEntry.getValue()
                        ));   
                    }
                }
                when Boolean {
                    picklistValuesInfoList.add(new PicklistInfo('True', 'True'));
                    picklistValuesInfoList.add(new PicklistInfo('False', 'False'));
                }
                when else {
                    return picklistValuesInfoList;
                }
            }
        } catch (Exception e) {
            System.debug('Error retrieving picklist field values: ' + e.getMessage());
            // Handle errors as needed
        }

        return picklistValuesInfoList;   
    }
    
    public PicklistMaster() {

    }
}