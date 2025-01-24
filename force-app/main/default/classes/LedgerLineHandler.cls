public without sharing class LedgerLineHandler extends TriggerHandlerUtilities  {
    
    public override void afterInsert(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug)
    {
        validateRecords((List<Ledger_Line__c>)n,new Map<Id,Ledger_Line__c>());
    }

    public override void afterUpdate(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug)
    {
        validateRecords((List<Ledger_Line__c>)n,(Map<Id,Ledger_Line__c>)oMap);
    }

    public override void afterDelete(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug)
    {
        validateRecords(new List<Ledger_Line__c>(),(Map<Id,Ledger_Line__c>)oMap);
    }

    private static void validateRecords(List<Ledger_Line__c> newLines, Map<Id,Ledger_Line__c> oldLines) {

        Map<String,Map<Id,Map<String,Decimal>>> ledgerLineMap = new Map<String,Map<Id,Map<String,Decimal>>>();

        if(!newLines.isEmpty()) {
            for(Ledger_Line__c line : newLines) {
                if(!oldLines.containsKey(line.Id)) {
                    ledgerLineMap = HandleAdjustment(ledgerLineMap,'Ledger',line.Ledger__c,line.Credit_Debit__c,line.Amount__c);
                    ledgerLineMap = HandleAdjustment(ledgerLineMap,'Journal',line.Journal__c,line.Credit_Debit__c,line.Amount__c);
                    continue;
                }
    
                if(oldLines.get(line.Id).Amount__c == line.Amount__c) continue;
                Decimal adjustmentAmount = line.Amount__c - oldLines.get(line.Id).Amount__c;
                ledgerLineMap = HandleAdjustment(ledgerLineMap,'Ledger',line.Ledger__c,line.Credit_Debit__c,adjustmentAmount);
                ledgerLineMap = HandleAdjustment(ledgerLineMap,'Journal',line.Journal__c,line.Credit_Debit__c,adjustmentAmount);
            }
        } else {
            if(oldLines.isEmpty()) return;
            for(Ledger_Line__c line : oldLines.values()) {
                Decimal adjustmentAmount = 0 - line.Amount__c;
                ledgerLineMap = HandleAdjustment(ledgerLineMap,'Ledger',line.Ledger__c,line.Credit_Debit__c,adjustmentAmount);
                ledgerLineMap = HandleAdjustment(ledgerLineMap,'Journal',line.Journal__c,line.Credit_Debit__c,adjustmentAmount);
            }
        } 

        if(ledgerLineMap.isEmpty()) return;

        HandleCalculations(ledgerLineMap);
    }

    public static Map<String,Map<Id,Map<String,Decimal>>> HandleAdjustment(Map<String,Map<Id,Map<String,Decimal>>> ledgerLineMap, String parentType, Id parentId, String creditDebit, Decimal amount) {
        
        if(!ledgerLineMap.containsKey(parentType)) {
            ledgerLineMap.put(parentType,new Map<Id,Map<String,Decimal>>());
        }

        if(!ledgerLineMap.get(parentType).containsKey(parentId)) {
            ledgerLineMap.get(parentType).put(parentId,new Map<String,Decimal>());
        }
        
        if(!ledgerLineMap.get(parentType).get(parentId).containsKey(creditDebit)) {
            ledgerLineMap.get(parentType).get(parentId).put(creditDebit,0.00);
        }
        Decimal adjustmentTotal = ledgerLineMap.get(parentType).get(parentId).get(creditDebit) + amount;
        ledgerLineMap.get(parentType).get(parentId).put(creditDebit,adjustmentTotal);

        return ledgerLineMap;
    }

    public static void HandleCalculations(Map<String,Map<Id,Map<String,Decimal>>> ledgerLineMap) {
        
        List<Ledger__c> ledgers = new List<Ledger__c>();
        List<Journal__c> journals = new List<Journal__c>();
        for(String parentType : ledgerLineMap.keySet()) {
            switch on parentType {
                when 'Ledger' {
                    ledgers = HandleLedgerUpdate(ledgerLineMap.get(parentType));
                }
                when 'Journal' {
                    journals = HandleJournalUpdate(ledgerLineMap.get(parentType));
                }
                when else {
                    throw new AuraHandledException('Missing Credit / Debit Value');
                }
            }
        }
        if(ledgers.size() > 0) {
            update ledgers;
        }
        if(journals.size() > 0) {
            update journals;
        }
    }

    private static List<Ledger__c> HandleLedgerUpdate(Map<Id,Map<String,Decimal>> parentMap) {
        List<Ledger__c> ledgers = new List<Ledger__c>();
        for(Ledger__c ledger : [SELECT Id, Credit__c, Debit__c FROM Ledger__c WHERE Id IN: parentMap.keySet()]) {
            Map<String,Decimal> adjustmentMap = parentMap.get(ledger.Id);
            for(String adjustment : adjustmentMap.keySet()) {
                switch on adjustment {
                    when 'Credit' {
                        ledger.Credit__c += adjustmentMap.get(adjustment);
                    }
                    when 'Debit' {
                        ledger.Debit__c += adjustmentMap.get(adjustment);
                    }
                    when else {
                        throw new AuraHandledException('Missing Credit / Debit Value');
                    }
                }
            }
            ledgers.add(ledger);
        }
        return ledgers;
    }

    private static List<Journal__c> HandleJournalUpdate(Map<Id,Map<String,Decimal>> parentMap) {
        List<Journal__c> journals = new List<Journal__c>();
        for(Journal__c journal : [SELECT Id, Credit__c, Debit__c FROM Journal__c WHERE Id IN: parentMap.keySet()]) {
            Map<String,Decimal> adjustmentMap = parentMap.get(journal.Id);
            for(String adjustment : adjustmentMap.keySet()) {
                switch on adjustment {
                    when 'Credit' {
                        journal.Credit__c += adjustmentMap.get(adjustment);
                    }
                    when 'Debit' {
                        journal.Debit__c += adjustmentMap.get(adjustment);
                    }
                    when else {
                        throw new AuraHandledException('Missing Credit / Debit Value');
                    }
                }
            }
            journals.add(journal);
        }
        return journals;
    }
}