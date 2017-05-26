package com.trihydro.timCreator.dao;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

import com.trihydro.timCreator.DBUtility;
import com.trihydro.timCreator.model.LocalNode;
import com.trihydro.timCreator.helpers.SQLNullHandler;

public class LocalNodeService {
	
	private Connection connection;

	public LocalNodeService(){
		connection = DBUtility.getConnection();	
	}	

    public Long insertLocalNode(LocalNode localNode, Long nodeXYId) {
    	try {
			
			String insertQueryStatement = "insert into local_node(node_xy_id, type) values (?,?)";

			PreparedStatement preparedStatement = connection.prepareStatement(insertQueryStatement, new String[] {"local_node_id"});
			
			SQLNullHandler.setLongOrNull(preparedStatement, 1, nodeXYId);
			SQLNullHandler.setLongOrNull(preparedStatement, 2, localNode.getType());

			// execute insert statement
 			Long localNodeId = null;

 			if(preparedStatement.executeUpdate() > 0){
 				ResultSet generatedKeys = preparedStatement.getGeneratedKeys();

 				if(generatedKeys != null && generatedKeys.next()){
 					localNodeId = generatedKeys.getLong(1);
 					System.out.println("------ Generated Local Node Id: " + localNodeId + " --------------");
 				}
 			}
 			
			return localNodeId;

	  } catch (SQLException e) {
		  e.printStackTrace();
	  }
	  return new Long(0);
    }
}
