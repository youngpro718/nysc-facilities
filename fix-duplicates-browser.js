// Fix Occupants Duplicates - Run this in Browser Console
// This script uses the existing Supabase client to remove duplicates

async function fixOccupantsDuplicates() {
    console.log('🔍 Starting duplicate cleanup process...');
    
    try {
        // Step 1: Fetch all occupants
        console.log('📊 Fetching all occupants...');
        const { data: allOccupants, error: fetchError } = await supabase
            .from('occupants')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (fetchError) {
            console.error('❌ Error fetching occupants:', fetchError);
            return;
        }
        
        console.log(`📋 Found ${allOccupants.length} total occupants`);
        
        // Step 2: Identify duplicates
        const duplicateGroups = {};
        const duplicatesToRemove = [];
        
        allOccupants.forEach(occupant => {
            const key = `${occupant.first_name || ''}_${occupant.last_name || ''}_${occupant.department || ''}_${occupant.title || ''}`;
            
            if (!duplicateGroups[key]) {
                duplicateGroups[key] = [];
            }
            duplicateGroups[key].push(occupant);
        });
        
        // Step 3: Find duplicates to remove (keep first, remove others)
        Object.entries(duplicateGroups).forEach(([key, group]) => {
            if (group.length > 1) {
                console.log(`🔍 Found ${group.length} duplicates for: ${group[0].first_name} ${group[0].last_name}`);
                // Keep the first (oldest) record, mark others for removal
                duplicatesToRemove.push(...group.slice(1));
            }
        });
        
        console.log(`🗑️ Found ${duplicatesToRemove.length} duplicate records to remove`);
        
        if (duplicatesToRemove.length === 0) {
            console.log('✅ No duplicates found! Database is clean.');
            return;
        }
        
        // Step 4: Remove duplicates
        console.log('🧹 Removing duplicate records...');
        const idsToRemove = duplicatesToRemove.map(d => d.id);
        
        const { error: deleteError } = await supabase
            .from('occupants')
            .delete()
            .in('id', idsToRemove);
            
        if (deleteError) {
            console.error('❌ Error removing duplicates:', deleteError);
            return;
        }
        
        console.log(`✅ Successfully removed ${duplicatesToRemove.length} duplicate records!`);
        
        // Step 5: Verify cleanup
        const { data: finalOccupants, error: verifyError } = await supabase
            .from('occupants')
            .select('first_name, last_name, department, title')
            .order('last_name');
            
        if (verifyError) {
            console.error('❌ Error verifying cleanup:', verifyError);
            return;
        }
        
        console.log(`📊 Final count: ${finalOccupants.length} occupants`);
        
        // Check for remaining duplicates
        const finalDuplicateCheck = {};
        finalOccupants.forEach(occupant => {
            const key = `${occupant.first_name || ''}_${occupant.last_name || ''}_${occupant.department || ''}_${occupant.title || ''}`;
            finalDuplicateCheck[key] = (finalDuplicateCheck[key] || 0) + 1;
        });
        
        const remainingDuplicates = Object.entries(finalDuplicateCheck).filter(([key, count]) => count > 1);
        
        if (remainingDuplicates.length === 0) {
            console.log('🎉 SUCCESS! All duplicates have been removed.');
            console.log('🔄 Please refresh the page to see the updated data.');
        } else {
            console.log('⚠️ Warning: Some duplicates may still remain:', remainingDuplicates);
        }
        
    } catch (error) {
        console.error('💥 Unexpected error during cleanup:', error);
    }
}

// Instructions
console.log(`
🚀 OCCUPANTS DUPLICATE CLEANUP TOOL
===================================

To fix the duplicate occupants issue, run:
fixOccupantsDuplicates()

This will:
1. Identify duplicate entries (same name, department, title)
2. Keep the oldest record for each person
3. Remove the duplicate records
4. Verify the cleanup was successful

⚠️  IMPORTANT: Make sure you're logged in as an admin before running this!
`);

// Auto-run the function
console.log('🔄 Auto-starting duplicate cleanup...');
fixOccupantsDuplicates();
