public with sharing class LedgerSummaryController {

    public class MasterSummary {

        @AuraEnabled
        public String label;
        @AuraEnabled
        public String name;

        public Map<String,LedgerSummary> summaryMap = new Map<String,LedgerSummary>{
            'asset' => new LedgerSummary('Asset','asset'),
            'liability' => new LedgerSummary('Liability','liability'),
            'equity' => new LedgerSummary('Equity','equity'),
            'income' => new LedgerSummary('Income','income'),
            'expense' => new LedgerSummary('Expense','expense'),
            'profitLoss' => new LedgerSummary('Profit / Loss','profitLoss')
        };

        public LedgerSummary GetSummary(String name) {
            return summaryMap.get(name);
        }

        @AuraEnabled
        public List<LedgerSummary> GetSummaries() {
            return summaryMap.values();
        }

        public MasterSummary(String label, String name) {
            this.label = label;
            this.name = name;
        }
    }

    @AuraEnabled
    public static List<MasterSummary> GetMasterSummary(Id financeAccountId) {
        
        Map<String,MasterSummary> masterSummary = new Map<String,MasterSummary>{
            'current' => new MasterSummary('Current','current'),
            'future' => new MasterSummary('Future', 'future'),
            'overall' => new MasterSummary('Overall', 'overall')
        };

        // Aggregate Ledger Credit & Debit Balances, split by Type and Forecast
        for(Ledger__c ledger : [SELECT Credit__c, Debit__c, Type__c, Forecast__c FROM Ledger__c WHERE Finance_Account__c =: financeAccountId]) {
            MasterSummary master = ledger.Forecast__c == 'Future' ? masterSummary.get('future') : masterSummary.get('current');
            String type = ledger.Type__c.toLowerCase();
            LedgerSummary summary = master.GetSummary(type);
            summary.AddCount();
            summary.AddCredit(ledger.Credit__c);
            summary.AddDebit(ledger.Debit__c);
            System.debug('Ledger Summary: '+summary);
        }

        // For each master summary add Income & Expense ledger balances to Profit / Loss
        for(String masterName : masterSummary.keySet()) {
            if(masterName == 'overall') continue;
            MasterSummary master = masterSummary.get(masterName);
            LedgerSummary profitLoss = masterSummary.get(masterName).GetSummary('profitLoss');
            LedgerSummary income = masterSummary.get(masterName).GetSummary('income');
            LedgerSummary expense = masterSummary.get(masterName).GetSummary('expense');
            profitLoss.AddCount();
            profitLoss.AddCredit(income.GetBalance());
            profitLoss.AddDebit(expense.GetBalance());
            System.debug('Profit / Loss Summary: '+profitLoss);
        }

        // Combine Current & Future Master Summmaries to populate Overall.
        for(LedgerSummary summary1 : masterSummary.get('overall').GetSummaries()) {
            for(String masterName : masterSummary.keySet()) {
                if(masterName == 'overall') continue;
                LedgerSummary summary2 = masterSummary.get(masterName).GetSummary(summary1.name);
                summary1.AddCount();
                summary1.AddCredit(summary2.totalCredit);
                summary1.AddDebit(summary2.totalDebit);
            } 
            System.debug('Overall Ledger Summary: '+summary1);
        }
        System.debug('Summaries Returned: '+masterSummary.values());
        return masterSummary.values();
    }
    
    public class LedgerSummary {
        
        @AuraEnabled
        public String type;
        @AuraEnabled
        public String name;

        @AuraEnabled
        public Integer count = 0;
        public void AddCount() {
            count ++;
        }

        @AuraEnabled
        public Decimal totalCredit = 0.00;
        public void AddCredit(Decimal amount) {
            totalCredit += amount;
        }
        
        @AuraEnabled
        public Decimal totalDebit = 0.00;
        public void AddDebit(Decimal amount) {
            totalDebit += amount;
        }

        @AuraEnabled
        public Decimal GetBalance(){
            if(type == 'Asset' || type == 'Expense') {
                return totalDebit - totalCredit;
            } else {
                return totalCredit - totalDebit;
            }
        }

        public LedgerSummary(String type, String name) {
            this.type = type;
            this.name = name;
        }
    }

    @AuraEnabled
    public static LedgerSummary GetSummary(Id financeAccountId, String ledgerType, String name) {
        LedgerSummary summary = new LedgerSummary(ledgerType,name);
        for(Ledger__c ledger : [SELECT Credit__c, Debit__c FROM Ledger__c WHERE Type__c =: ledgerType AND Finance_Account__c =: financeAccountId]) {
            summary.AddCount();
            summary.AddCredit(ledger.Credit__c);
            summary.AddDebit(ledger.Debit__c);
        }
        System.debug('Summary Returned: '+summary);
        return summary;
    }
}