public without sharing class LedgerLineHandler extends TriggerHandlerUtilities  {
    
    public override void afterInsert(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug)
    {
        validateRecords((List<Ledger_Line__c>)n,new Map<Id,Ledger_Line__c>());
    }

    public override void afterUpdate(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug)
    {
        validateRecords((List<Ledger_Line__c>)n,(Map<Id,Ledger_Line__c>)oMap);
    }


    private static void validateRecords(List<Ledger_Line__c> newLines, Map<Id,Ledger_Line__c> oldLines) {

        List<Ledger_Line__c> validLines = new List<Ledger_Line__c>();
        Map<Id,Decimal> lineAdjustmentMap = new Map<Id,Decimal>();

        for(Ledger_Line__c line : newLines) {
            if(!oldLines.containsKey(line.Id)) {
                validLines.add(line);
                continue;
            }

            if(oldLines.get(line.Id).Amount__c == line.Amount__c) continue;
            validLines.add(line);
            lineAdjustmentMap.put(line.Id,line.Amount__c - oldLines.get(line.Id).Amount__c);
        }

        if(validLines.isEmpty()) return;

        UpdateCalculations(validLines,lineAdjustmentMap);
    }

    private static void UpdateCalculations(List<Ledger_Line__c> newLines, Map<Id,Decimal> lineAdjustmentMap) {
        
        Map<String,Set<Id>> parentIdMap = new Map<String,Set<Id>>{
            'Ledger' => new Set<Id>(),
            'Journal' => new Set<Id>()
        };
        for(Ledger_Line__c line : newLines) {
            parentIdMap.get('Ledger').add(line.Ledger__c);
            parentIdMap.get('Journal').add(line.Journal__c);
        }

        Map<Id,Ledger__c> ledgerMap = new Map<Id,Ledger__c>([
            SELECT Id, Credit__c, Debit__c FROM Ledger__c WHERE Id IN :parentIdMap.get('Ledger')
        ]);
        Map<Id,Journal__c> journalMap = new Map<Id,Journal__c>([
            SELECT Id, Credit__c, Debit__c FROM Journal__c WHERE Id IN :parentIdMap.get('Journal')
        ]);

        for(Ledger_Line__c line : newLines) {
            Ledger__c ledger = ledgerMap.get(line.Ledger__c);
            Journal__c journal = journalMap.get(line.Journal__c);

            Decimal value = lineAdjustmentMap.containsKey(line.Id) ? lineAdjustmentMap.get(line.Id) : line.Amount__c;

            if(line.Credit_Debit__c == 'Credit') {
                ledger.Credit__c += value;
                journal.Credit__c += value;
            } else {
                ledger.Debit__c += value;
                journal.Debit__c += value;
            }

            ledgerMap.put(ledger.Id,ledger);
            journalMap.put(journal.Id,journal);
        }

        update new List<Ledger__c>(ledgerMap.values());
        update new List<Journal__c>(journalMap.values());
    }
}