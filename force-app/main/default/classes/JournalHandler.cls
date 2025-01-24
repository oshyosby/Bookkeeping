public without sharing class JournalHandler extends TriggerHandlerUtilities {
    
    public override void beforeDelete(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug)
    {
        Map<String,Map<Id,Map<String,Decimal>>> ledgerLineMap = new Map<String,Map<Id,Map<String,Decimal>>>();
        for(Ledger_Line__c ledgerLine : [SELECT Id, Amount__c, Credit_Debit__c, Ledger__c FROM Ledger_Line__c WHERE Journal__c IN: oMap.keySet()]) {
            LedgerLineHandler.HandleAdjustment(ledgerLineMap,'Ledger',ledgerLine.Ledger__c,ledgerLine.Credit_Debit__c,0-ledgerLine.Amount__c);
        }
        LedgerLineHandler.HandleCalculations(ledgerLineMap);
    }
}