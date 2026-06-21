const db = require('../lib/db');

async function run() {
  try {
    const id = 0;
    const lecturerId = 2; // Athaya (user_id 3)
    const [[data]] = await db.query(
      `SELECT csm.id, csm.role AS member_role, csm.status, csm.responded_at, csm.created_at,
              cs.title AS service_title, cs.description, cs.start_date, cs.end_date, cs.location, cs.funding_source,
              u_creator.name AS creator_name,
              l_creator.nidn AS creator_nidn,
              l_creator.academic_rank AS creator_academic_rank,
              u_member.name  AS member_name,
              u_member.email AS member_email,
              l_member.nidn  AS member_nidn,
              l_member.academic_rank AS member_academic_rank
       FROM community_service_members csm
       JOIN community_services cs ON csm.community_service_id = cs.id
       JOIN users u_creator ON cs.created_by = u_creator.id
       LEFT JOIN lecturers l_creator ON u_creator.id = l_creator.user_id
       JOIN lecturers l_member ON csm.lecturer_id = l_member.id
       JOIN users u_member ON l_member.user_id = u_member.id
       WHERE csm.id = ? AND csm.lecturer_id = ?`,
      [id, lecturerId]
    );

    console.log("Full Query Result:", data);
    process.exit(0);
  } catch (err) {
    console.error("Error executing full test query:", err);
    process.exit(1);
  }
}

run();
