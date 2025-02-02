({    
    invoke : function(component, event, helper) 
    {
        // Get the Lightning event
        var eventToFire = $A.get(component.get("v.eventName"));
        // Check for params, set on the event if there are params to set
        var params = component.get("v.paramsJSON");
        if (params)
        {
            eventToFire.setParams(JSON.parse(params));
        }
        
        //Fire our event
        eventToFire.fire();
    }
})