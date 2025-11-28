import json
from flask import Blueprint, Flask, jsonify, request, abort
from datetime import datetime
from pathlib import Path
from app.modules.schedule.scheduleConnectors import schedulesData

schedule_bp = Blueprint('schedule', __name__)
DATA_FILE = "database/mock_schedule.json"
MOCK_TUTOR_ID = 1 # We'll assume operations default to this tutor if not specified

# --- Utility Functions for Mock Data ---

def generate_new_id(schedules):
    """Generates a unique ID across all slots in all schedules."""
    max_id = 100 
    for schedule in schedules.values():
        if schedule['slots']:
            current_max = max(slot['id'] for slot in schedule['slots'])
            max_id = max(max_id, current_max)
    return max_id + 1

def validate_times(start_str, end_str):
    """Basic validation and returns datetime objects."""
    try:
        # Handling the Z (Zulu time) for parsing
        start_dt = datetime.fromisoformat(start_str.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end_str.replace('Z', '+00:00'))
        if start_dt >= end_dt:
            return None, None, "Start time must be before end time."
        return start_dt, end_dt, None
    except ValueError:
        return None, None, "Invalid datetime format. Use ISO 8601 (e.g., 2025-12-01T09:00:00Z)."

# --- ScheduleAccessService Implementation (API Endpoints) ---


# POST new timeslot by tutor
# (POST)/schedule/:tutor_id/new
@schedule_bp.route('/<tutor_id>/slot/new', methods=['POST'])
def createFreetime(tutor_id):
    """Implements createFreetime(start, end) for a hardcoded MOCK_TUTOR_ID."""
    start_str = request.args.get('start')
    end_str = request.args.get('end')

    if not start_str or not end_str:
        return jsonify({"error": "Missing 'start' or 'end' query parameters."}), 400
    
    start_dt, end_dt, error = validate_times(start_str, end_str)
    if error:
        return jsonify({"error": error}), 400
    
    schedules = schedulesData.data
    
    # 1. Ensure the tutor's schedule structure exists
    if tutor_id not in schedules:
        schedules[tutor_id] = {"tutor_id": MOCK_TUTOR_ID, "slots": []}

    tutor_slots = schedules[tutor_id]['slots']

    # 2. Check for overlaps
    for slot in tutor_slots:
        slot_start = datetime.fromisoformat(slot['start'].replace('Z', '+00:00'))
        slot_end = datetime.fromisoformat(slot['end'].replace('Z', '+00:00'))
        if (start_dt < slot_end and end_dt > slot_start):
             return jsonify({"error": "New free time overlaps with an existing slot."}), 409

    # 3. Create the new slot
    new_slot = {
        "id": generate_new_id(schedules),
        "start": start_str,
        "end": end_str
    }
    tutor_slots.append(new_slot)
    schedulesData._save()

    # Return the newly created slot, including the implicit tutor_id
    response = new_slot.copy()
    response['tutor_id'] = tutor_id
    return jsonify(response), 201



@schedule_bp.route('<tutor_id>/slot/<slot_id>', methods=['PUT'])
def editFreetime(tutor_id, slot_id):
    """
    Edits the start and end times of a specific slot identified by slot_id 
    for a given tutor_id.
    """
    start_str = request.args.get('start')
    end_str = request.args.get('end')

    if not start_str or not end_str:
        return jsonify({"error": "Missing 'start' or 'end' query parameters."}), 400
    
    # 1. Validate the new times
    start_dt, end_dt, error = validate_times(start_str, end_str)
    if error:
        return jsonify({"error": error}), 400

    # Ensure slot_id is an integer for comparison
    try:
        slot_id_int = int(slot_id)
    except ValueError:
        return jsonify({"error": "Invalid slot ID format. Must be an integer."}), 400

    schedules = schedulesData.data

    # 2. Check if the tutor exists
    if tutor_id not in schedules:
        return jsonify({"message": "Tutor schedule not found."}), 404

    tutor_slots = schedules[tutor_id]['slots']
    
    found_slot = None
    
    # 3. Find the slot to be edited
    for slot in tutor_slots:
        if slot['id'] == slot_id_int:
            found_slot = slot
            break
    
    if found_slot is None:
        return jsonify({"message": f"Free time slot with ID {slot_id} not found for tutor {tutor_id}."}), 404

    # 4. Check for overlaps with *other* slots
    for slot in tutor_slots:
        # Skip checking against the slot we are currently editing
        if slot['id'] == slot_id_int:
            continue 

        # Parse existing slot times
        slot_start = datetime.fromisoformat(slot['start'].replace('Z', '+00:00'))
        slot_end = datetime.fromisoformat(slot['end'].replace('Z', '+00:00'))

        # Overlap check
        if (start_dt < slot_end and end_dt > slot_start):
             return jsonify({
                 "error": "Edited time slot overlaps with an existing slot.",
                 "overlapping_slot_id": slot['id']
             }), 409

    # 5. Update the found slot's details
    found_slot['start'] = start_str
    found_slot['end'] = end_str
    
    # 6. Save the modified schedules back to the file
    schedulesData._save()
    
    # 7. Return the updated slot data
    response = found_slot.copy()
    response['tutor_id'] = tutor_id
    
    return jsonify({
        "message": "Free time slot updated successfully.",
        "updated_slot": response
    }), 200



@schedule_bp.route('<tutor_id>/slot/<slot_id>', methods=['DELETE'])
def deleteFreetime(tutor_id, slot_id):
    """Implements deleteFreetime(start, end) for a hardcoded MOCK_TUTOR_ID."""

    schedules = schedulesData.data

    try:
        slot_id_int = int(slot_id)
    except ValueError:
        return jsonify({"error": "Invalid slot ID format. Must be an integer."}), 400
    
    if tutor_id not in schedules:
        return jsonify({"message": "Tutor schedule not found."}), 404

    tutor_slots = schedules[tutor_id]['slots']

# Initialize a flag or index for tracking the slot
    slot_index_to_delete = -1
    
    # 2. Find the slot by ID and get its index
    for index, slot in enumerate(tutor_slots):
        # We compare the URL slot_id (now integer) against the slot's ID field
        if slot['id'] == slot_id_int:
            slot_index_to_delete = index
            break
            
    # 3. Handle case where the slot was not found
    if slot_index_to_delete == -1:
        return jsonify({"message": f"Free time slot with ID {slot_id} not found for tutor {tutor_id}."}), 404

    # 4. Delete the slot
    # The .pop() method removes the item at the specified index
    deleted_slot = tutor_slots.pop(slot_index_to_delete)
        
    schedulesData._save()
    return jsonify({"message": "Free time slot deleted successfully."}), 200



# GET schedule by tutor
# (GET)/schedule/:tutor_id
@schedule_bp.route('/<tutor_id>', methods=['GET'])
def getScheduleByTutorId(tutor_id):
    """Implements getScheduleByTutorId(tutorId, start, end)."""
    start_str = request.args.get('start')
    end_str = request.args.get('end')

    if not start_str or not end_str:
        return jsonify({"error": "Missing 'start' or 'end' query parameters."}), 400

    start_dt, end_dt, error = validate_times(start_str, end_str)
    if error:
        return jsonify({"error": error}), 400


    schedules = schedulesData.data
    
    if tutor_id not in schedules:
        return jsonify({"error": "Tutor schedule not found."}), 404

    tutor_slots = schedules[tutor_id]['slots']
    
    # Filter the tutor's slots by the requested time range
    filtered_slots = [
        slot for slot in tutor_slots
        if datetime.fromisoformat(slot['start'].replace('Z', '+00:00')) >= start_dt and
           datetime.fromisoformat(slot['end'].replace('Z', '+00:00')) <= end_dt
    ]
    
    return jsonify(filtered_slots)
