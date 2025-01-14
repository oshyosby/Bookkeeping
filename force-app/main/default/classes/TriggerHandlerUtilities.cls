public virtual class TriggerHandlerUtilities implements TriggerHandlerInterface
{
    private static Set<String> recursionCheckSet = new Set<String>();
    
    //Method to allow us to reset the recursion check within test classes
    public static void resetRecursionCheckSet()
    {
        if (!Test.isRunningTest())
            throw new triggerHandlerException('resetRecursionCheckSet is only to be used within test methods');
        recursionCheckSet = new Set<String>();
    }
    
    public static void handleEvent(String objAPIName, System.TriggerOperation operationType, List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap)
    {    
        //Build a query string that will be used to query the custom metadata type, and return the classes which have subscribed to this event.
        String query = 'SELECT Id, Object_API_Name__c, Class_Name__c, Allow_Recursive_Calls__c, Debug__c, Sequence__c FROM Trigger_Registration__mdt WHERE Active__c=true AND Object_API_Name__c=\'' +objAPIName +'\'';        
        switch on operationType
        {
            when BEFORE_INSERT { query += ' AND Before_Insert__c=true'; }
            when BEFORE_UPDATE { query += ' AND Before_Update__c=true'; }
            when BEFORE_DELETE { query += ' AND Before_Delete__c=true'; }
            when AFTER_INSERT { query += ' AND After_Insert__c=true'; }
            when AFTER_UPDATE { query += ' AND After_Update__c=true'; }
            when AFTER_DELETE { query += ' AND After_Delete__c=true'; }
            when AFTER_UNDELETE { query += ' AND After_Undelete__c=true'; }
        }   
        query += ' ORDER BY Sequence__c ASC';
        
        //getGlobalDescribe() is VERY CPU intensive, so we want to make sure that we only call it once per transation and pass 
        //it into each subscribed handler class - rather than each subscribed class potentially having to call it separately.
        Map<String, Schema.SObjectType> sotMap = Schema.getGlobalDescribe();
        Schema.SObjectType sot = sotMap.get(objAPIName);

        //from SOT create a map from Developer Name -> Record Type Id call it dNameToRTId for now
        
        Type t;

        //Loop thru each subscribed class
        for (Trigger_Registration__mdt tr : Database.query(query)) 
        {
            if (tr.Debug__c)
            {
                log('Handle event ' +operationType +' for object: ' +tr.Object_API_Name__c);
                log('Found Trigger Registration with Id: ' +tr.Id);
            }   
            
            t = Type.forName(tr.Class_Name__c);            
            if(t == null || !(t.newInstance() instanceof TriggerHandlerInterface))
            {
                log('INVALID CLASS ' +tr.Class_Name__c);  
                continue;
            }
            
            //If the registered class does NOT wish to be called multiple times....
            if (!tr.Allow_Recursive_Calls__c && recursionCheckSet.contains(tr.Id))
            {
                if (tr.Debug__c)
                    log('Skipping recursive call for Trigger Registration with Id: ' +tr.Id);
                continue;
            }
            
            //Add the operation type to the recursionCheckSet so that we can check if this operation type gets called recursively
            recursionCheckSet.add(tr.Id);
            
            if (tr.Debug__c)
            {
                log('Calling Class: ' +tr.Class_Name__c +' Operation: ' +operationType);  
                log(getLimitDebugString());
            }
                
            
            TriggerHandlerInterface thi = (TriggerHandlerInterface) t.newInstance();        
            switch on operationType
            {
                when BEFORE_INSERT { thi.beforeInsert(o, oMap, n, nMap, sot, tr.Debug__c); }
                when BEFORE_UPDATE { thi.beforeUpdate(o, oMap, n, nMap, sot, tr.Debug__c); }
                when BEFORE_DELETE { thi.beforeDelete(o, oMap, n, nMap, sot, tr.Debug__c); }
                when AFTER_INSERT { thi.afterInsert(o, oMap, n, nMap, sot, tr.Debug__c); }
                when AFTER_UPDATE { thi.afterUpdate(o, oMap, n, nMap, sot, tr.Debug__c); }
                when AFTER_DELETE { thi.afterDelete(o, oMap, n, nMap, sot, tr.Debug__c); }
                when AFTER_UNDELETE { thi.afterUndelete(o, oMap, n, nMap, sot, tr.Debug__c); }
            } 
            
            if (tr.Debug__c)
            {
                log('Class Execution Completed: ' +tr.Class_Name__c);
                log(getLimitDebugString());
            }      
        }  
    }
    
    public static String getLimitDebugString()
    {
        String debugString = ''; 
        
        debugString += 'Aggregate Queries: ' +Limits.getAggregateQueries() +'/' +Limits.getLimitAggregateQueries();   
        debugString += '\nCallouts: ' +Limits.getCallouts() +'/' +Limits.getLimitCallouts();     
        debugString += '\nCPU Time: ' +Limits.getCpuTime() +'/' +Limits.getLimitCpuTime();
        debugString += '\nDatabase Time: ' +Limits.getDatabaseTime() +'/' +Limits.getLimitDatabaseTime();       
        debugString += '\nDML Rows: ' +Limits.getDmlRows() +'/' +Limits.getLimitDmlRows();    
        debugString += '\nDML Statements: ' +Limits.getDmlStatements() +'/' +Limits.getLimitDmlStatements();    
        debugString += '\nQueries: ' +Limits.getQueries() +'/' +Limits.getLimitQueries();
        
        return debugString;
    }
    
    private static void log (String message)
    {
        System.debug('VFS_Trigger_Handler_Utility - ' +message);
    }
    
    public virtual void beforeInsert(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug) 
    {
        throw new TriggerHandlerException('A class has subscribed to the beforeInsert event without providing an implementation of the beforeInsert method');
    }
    public virtual void beforeUpdate(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug)
    {
        throw new TriggerHandlerException('A class has subscribed to the beforeUpdate event without providing an implementation of the beforeUpdate method');
    }
    public virtual void beforeDelete(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug) 
    {
        throw new TriggerHandlerException('A class has subscribed to the beforeDelete event without providing an implementation of the beforeDelete method');
    }
    public virtual void afterInsert(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug) 
    {
        throw new TriggerHandlerException('A class has subscribed to the afterInsert event without providing an implementation of the afterInsert method');
    } 
    public virtual void afterUpdate(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug) 
    {
        throw new TriggerHandlerException('A class has subscribed to the afterUpdate event without providing an implementation of the afterUpdate method');
    } 
    public virtual void afterDelete(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug) 
    {
        throw new TriggerHandlerException('A class has subscribed to the afterDelete event without providing an implementation of the afterDelete method');
    }
    public virtual void afterUndelete(List<SObject> o, Map<Id, SObject> oMap, List<SObject> n, Map<Id, SObject> nMap, Schema.SObjectType sot, Boolean debug) 
    {
        throw new TriggerHandlerException('A class has subscribed to the afterUndelete event without providing an implementation of the afterUndelete method');
    }  
    
    public class TriggerHandlerException extends Exception {}
}