trigger LedgerLine_Trigger on Ledger_Line__c (after insert, after update, after delete) {
    TriggerHandlerUtilities.handleEvent('Ledger_Line__c', Trigger.operationType, Trigger.old, Trigger.oldMap, Trigger.new, Trigger.newMap);   
}