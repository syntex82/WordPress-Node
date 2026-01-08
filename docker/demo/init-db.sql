-- NodePress Demo Database Initialization
-- Creates necessary extensions and the main demo tracking database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_stat_statements for monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Create function to generate unique database names
CREATE OR REPLACE FUNCTION generate_demo_db_name(subdomain TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN 'demo_' || regexp_replace(subdomain, '-', '_', 'g');
END;
$$ LANGUAGE plpgsql;

-- Create function to provision a new demo database
CREATE OR REPLACE FUNCTION create_demo_database(subdomain TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  db_name TEXT;
BEGIN
  db_name := generate_demo_db_name(subdomain);
  
  -- Check if database already exists
  IF EXISTS (SELECT 1 FROM pg_database WHERE datname = db_name) THEN
    RETURN FALSE;
  END IF;
  
  -- Create the database
  EXECUTE format('CREATE DATABASE %I', db_name);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to drop a demo database
CREATE OR REPLACE FUNCTION drop_demo_database(subdomain TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  db_name TEXT;
BEGIN
  db_name := generate_demo_db_name(subdomain);
  
  -- Check if database exists
  IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = db_name) THEN
    RETURN FALSE;
  END IF;
  
  -- Terminate all connections to the database
  EXECUTE format('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = %L', db_name);
  
  -- Drop the database
  EXECUTE format('DROP DATABASE IF EXISTS %I', db_name);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_demo_database(TEXT) TO nodepress;
GRANT EXECUTE ON FUNCTION drop_demo_database(TEXT) TO nodepress;

