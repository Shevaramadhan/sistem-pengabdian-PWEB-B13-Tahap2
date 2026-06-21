const db = require('../lib/db');

async function run() {
  try {
    const id = 0;
    const lecturerId = 2; // For lecturer user athaya (user_id 3)
    const [[data]] = await db.query(
      `SELECT csm.id, csm.role AS member_role, csm.status, csm.responded_at, csm.created_at,
              cs.title AS service_title, cs.description, cs.start_date, cs.end_date, cs.location,
              u_creator.name AS creator_name,
              u_member.name  AS member_name,
              u_member.email AS member_email
       FROM community_service_members csm
       JOIN community_services cs ON csm.community_service_id = cs.id
       JOIN users u_creator ON cs.created_by = u_creator.id
       JOIN lecturers l ON csm.lecturer_id = l.id
       JOIN users u_member ON l.user_id = u_member.id
       WHERE csm.id = ? AND csm.lecturer_id = ?`,
      [id, lecturerId]
    );

    console.log("Query Result:", data);
    process.exit(0);
  } catch (err) {
    console.error("Error executing test query:", err);
    process.exit(1);
  }
}

run();
