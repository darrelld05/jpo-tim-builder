
CREATE TABLE RSU(
	rsu_id INT NOT NULL AUTO_INCREMENT,
	url VARCHAR(255) NOT NULL,
	rsu_username VARCHAR(255) NOT NULL,
	rsu_password VARCHAR(255) NOT NULL,
	latitude DECIMAL(11, 8) NOT NULL,
	longitude DECIMAL(11, 8) NOT NULL,
	milepost DECIMAL(38, 8),
	PRIMARY KEY (rsu_id)
);

CREATE TABLE MILEPOST(
	milepost_id INT NOT NULL AUTO_INCREMENT,
	route VARCHAR(255),
	milepost DECIMAL(38, 8),
	direction VARCHAR(255),
	latitude DECIMAL(11, 8),
	longitude DECIMAL(11, 8),
	elevation_ft DECIMAL(38, 8),
	bearing DECIMAL(38,8),	
	PRIMARY KEY (milepost_id)
);

CREATE TABLE CATEGORY(
	category_id INT NOT NULL AUTO_INCREMENT,
	category VARCHAR(255),	
	PRIMARY KEY (category_id)
);

CREATE TABLE ITIS_CODE(
	itis_code_id INT NOT NULL AUTO_INCREMENT,
	itis_code INT,
	description VARCHAR(255),
	category_id INT NOT NULL,
	PRIMARY KEY (itis_code_id),
	CONSTRAINT fk_category FOREIGN KEY (category_id) 	
	REFERENCES CATEGORY(category_id)
);

INSERT INTO RSU (url, rsu_username, rsu_password, latitude, longitude)
VALUES ('192.168.0.145', 'v3user', 'password', 41.123456, 110.123456);

INSERT INTO RSU (url, rsu_username, rsu_password, latitude, longitude)
VALUES ('10.145.10.15', 'v3user', 'password', 41.87654, 110.87654);

INSERT INTO CATEGORY (category)
VALUES ('speedLimit');

INSERT INTO CATEGORY (category)
VALUES ('advisory');

INSERT INTO CATEGORY (category)
VALUES ('workZone');

INSERT INTO CATEGORY (category)
VALUES ('exitService');

INSERT INTO ITIS_CODE (description, category_id, itis_code)
VALUES ('Speed Limit', 1, 268);

INSERT INTO ITIS_CODE (description, category_id, itis_code)
VALUES ('Accident', 2, 513);

INSERT INTO MILEPOST (route, milepost, direction, latitude, longitude, elevation_ft, bearing)
VALUES ('I 80', 0.0, 'eastbound', 41.24763487, -111.04672368, 6758.03058453, 111.13333269);

INSERT INTO MILEPOST (route, milepost, direction, latitude, longitude, elevation_ft, bearing)
VALUES ('I 80', 1.0, 'eastbound', 41.24816495, -111.04672312, 6751.60266925, 0.0);

INSERT INTO MILEPOST (route, milepost, direction, latitude, longitude, elevation_ft, bearing)
VALUES ('I 80', 2.0, 'eastbound', 41.24638234, -111.027816, 6753.52824038, 89.08132948);

