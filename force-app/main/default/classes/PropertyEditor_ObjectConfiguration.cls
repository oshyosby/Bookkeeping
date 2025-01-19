public with sharing class PropertyEditor_ObjectConfiguration {
    
    public class SObjectInfo {
        @AuraEnabled
        public String apiName;
        @AuraEnabled
        public String label;

        public SObjectInfo(String apiName, String label) {
            this.apiName = apiName;
            this.label = label;
        }
    }

    @AuraEnabled(cacheable=true)
    public static List<SObjectInfo> GetObjectTypes() {
        Map<String, Schema.SObjectType> schemaMap = Schema.getGlobalDescribe();
        List<SObjectInfo> sObjectInfoList = new List<SObjectInfo>();

        for (String apiName : schemaMap.keySet()) {
            Schema.SObjectType sObjectType = schemaMap.get(apiName);
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();

            // Add to the list
            sObjectInfoList.add(new SObjectInfo(apiName, describeResult.getLabel()));
        }

        return sObjectInfoList;
    }

    @AuraEnabled(cacheable=true)
    public static List<SObjectInfo> GetPicklistFields(String objectType){
        List<SObjectInfo> picklistFieldInfoList = new List<SObjectInfo>();

        try {
            // Get the SObject Describe result
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectType);
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();

            // Iterate over fields
            Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();
            for (String fieldName : fieldsMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldsMap.get(fieldName).getDescribe();

                if (fieldDescribe.getType() != Schema.DisplayType.Picklist) continue;
                picklistFieldInfoList.add(new SObjectInfo(
                    fieldName,
                    fieldDescribe.getLabel()
                ));   
            }
        } catch (Exception e) {
            System.debug('Error retrieving picklist fields: ' + e.getMessage());
            // Handle errors as needed
        }

        return picklistFieldInfoList;   
    }

    @AuraEnabled(cacheable=true)
    public static List<SObjectInfo> GetPicklistFieldValues(String objectType, String picklistField){
        List<SObjectInfo> picklistFieldValuesInfoList = new List<SObjectInfo>();

        if(objectType == null || picklistField == null) return picklistFieldValuesInfoList;

        try {
            // Get the SObject Describe result
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectType);
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();

            // Iterate over fields
            Map<String, Schema.SObjectField> fieldsMap = describeResult.fields.getMap();
            Schema.DescribeFieldResult fieldDescribe = fieldsMap.get(picklistField).getDescribe();

            List<Schema.PicklistEntry> fieldPicklistValues = fieldDescribe.getPicklistValues();
            for (Schema.PicklistEntry picklistEntry : fieldPicklistValues) {
                picklistFieldValuesInfoList.add(new SObjectInfo(
                    picklistEntry.getValue(),
                    picklistEntry.getLabel()
                ));   
            }
        } catch (Exception e) {
            System.debug('Error retrieving picklist field values: ' + e.getMessage());
            // Handle errors as needed
        }

        return picklistFieldValuesInfoList;   
    }
}