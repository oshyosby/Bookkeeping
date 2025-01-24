trigger Journal_Trigger on Journal__c (before delete) {
    TriggerHandlerUtilities.handleEvent('Journal__c', Trigger.operationType, Trigger.old, Trigger.oldMap, Trigger.new, Trigger.newMap);   
}